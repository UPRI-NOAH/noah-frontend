import logging

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .llm_pipeline import generate_forecast_summary
from .serializers import ForecastSummaryInputSerializer

logger = logging.getLogger(__name__)


class ForecastSummaryView(APIView):
    """
    POST /api/forecast-summary/

    Accept a verified forecast JSON object and return an LLM-generated
    executive summary (or a deterministic fallback if the LLM is unavailable
    or produces invalid output).
    """

    def post(self, request: Request) -> Response:
        serializer = ForecastSummaryInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        summary_json = serializer.validated_data
        result = generate_forecast_summary(summary_json)

        return Response(result, status=status.HTTP_200_OK)
