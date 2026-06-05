"""
Management command: sync_and_summarize

Syncs all past typhoon event tabs from Google Sheets and optionally
runs the LLM pipeline for every event that has confirmed municipalities
but no cached summary.

Usage:
    python manage.py sync_and_summarize
    python manage.py sync_and_summarize --generate  # also run LLM for each
    python manage.py sync_and_summarize --event-id 3  # single event
"""

from django.core.management.base import BaseCommand

from ibff_summarizer.models import PastEvent
from ibff_summarizer.past_event_pipeline import generate_past_event_summary, sync_past_events


class Command(BaseCommand):
    help = 'Sync past typhoon events from Google Sheets and generate LLM summaries.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--generate',
            action='store_true',
            help='Generate LLM summaries for events that do not have one yet.',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Regenerate summaries for ALL events, even those already summarized.',
        )
        parser.add_argument(
            '--event-id',
            type=int,
            help='Only process a single event by database ID.',
        )

    def handle(self, *args, **options):
        event_id = options.get('event_id')
        do_generate = options['generate'] or options['all']

        if event_id:
            try:
                event = PastEvent.objects.get(pk=event_id)
                self.stdout.write(f'Generating summary for: {event.event_name}')
                result = generate_past_event_summary(event)
                self.stdout.write(self.style.SUCCESS(
                    f'Done [{result["_source"]}]: {result["executive_summary"][:80]}...'
                ))
            except PastEvent.DoesNotExist:
                self.stderr.write(f'Event ID {event_id} not found.')
            return

        # Sync from Sheets
        self.stdout.write('Syncing from Google Sheets...')
        results = sync_past_events()
        created = sum(1 for _, c, _ in results if c)
        updated = sum(1 for _, _, u in results if u)
        self.stdout.write(self.style.SUCCESS(
            f'Synced {len(results)} events: {created} new, {updated} updated.'
        ))

        if not do_generate:
            for event, _, _ in results:
                status = '✓ summary' if hasattr(event, 'summary') else '— no summary'
                self.stdout.write(
                    f'  {event.event_name}: {event.confirmed_municipalities}/'
                    f'{event.total_municipalities} confirmed  {status}'
                )
            self.stdout.write('\nRun with --generate to create LLM summaries.')
            return

        # Generate summaries
        regen_all = options['all']
        events_to_process = [
            event for event, _, _ in results
            if event.confirmed_municipalities > 0
            and (regen_all or not hasattr(event, 'summary'))
        ]

        if not events_to_process:
            self.stdout.write('No events need summarization.')
            return

        for event in events_to_process:
            self.stdout.write(f'Summarizing: {event.event_name}...')
            try:
                result = generate_past_event_summary(event)
                self.stdout.write(self.style.SUCCESS(
                    f'  [{result["_source"]}] {result["executive_summary"][:80]}...'
                ))
            except Exception as exc:
                self.stderr.write(f'  Failed: {exc}')
