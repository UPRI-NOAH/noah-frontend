import logging
from datetime import datetime, timezone

from django.conf import settings
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PastEvent
from .past_event_pipeline import generate_past_event_summary, sync_past_events
from .past_event_serializers import PastEventListSerializer

logger = logging.getLogger(__name__)


def _needs_sync() -> bool:
    """True if no events exist or the most recent sync is older than the cache window."""
    latest = PastEvent.objects.order_by('-last_synced_at').first()
    if latest is None:
        return True
    return latest.is_stale(settings.SHEETS_SYNC_CACHE_MINUTES)


class PastEventListView(APIView):
    """
    GET /api/past-events/
    Returns all synced past typhoon events. Auto-syncs from Sheets if cache is stale.

    POST /api/past-events/sync/
    Force re-sync from Google Sheets regardless of cache.
    """

    def get(self, request: Request) -> Response:
        if _needs_sync():
            try:
                sync_past_events()
            except Exception as exc:
                logger.warning('Auto-sync failed: %s', exc)
                # Return stale data if available rather than erroring out
                if not PastEvent.objects.exists():
                    return Response(
                        {'error': 'Unable to sync from Google Sheets. Check service account permissions.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

        events = PastEvent.objects.prefetch_related('summary').all()
        serializer = PastEventListSerializer(events, many=True)
        return Response(serializer.data)


class PastEventSyncView(APIView):
    """POST /api/past-events/sync/ — force sync from Google Sheets."""

    def post(self, request: Request) -> Response:
        try:
            results = sync_past_events()
        except Exception as exc:
            logger.error('Sheets sync failed: %s', exc)
            return Response(
                {'error': str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        created = sum(1 for _, c, _ in results if c)
        updated = sum(1 for _, _, u in results if u)
        total = len(results)
        return Response({'synced': total, 'created': created, 'updated': updated})


class PastEventGenerateView(APIView):
    """
    GET  /api/past-events/{pk}/summary/ — return cached summary or 404.
    POST /api/past-events/{pk}/generate/ — run LLM pipeline and return summary.
    """

    def _get_event(self, pk: int):
        try:
            return PastEvent.objects.get(pk=pk)
        except PastEvent.DoesNotExist:
            return None

    def get(self, request: Request, pk: int) -> Response:
        event = self._get_event(pk)
        if event is None:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        if not hasattr(event, 'summary'):
            return Response({'error': 'No summary generated yet'}, status=status.HTTP_404_NOT_FOUND)

        output = event.summary.summary_output
        output['_source'] = event.summary.source
        output['_model'] = settings.OLLAMA_MODEL
        output['_generated_at'] = event.summary.generated_at.isoformat()
        return Response(output)

    def post(self, request: Request, pk: int) -> Response:
        event = self._get_event(pk)
        if event is None:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            result = generate_past_event_summary(event)
        except Exception as exc:
            logger.error('Summary generation failed for event %s: %s', pk, exc)
            return Response(
                {'error': 'Summary generation failed. Ensure Ollama is running.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result)
