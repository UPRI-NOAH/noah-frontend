"""
Management command: human_eval_export

Runs both the LLM pipeline and the deterministic fallback on the same CSV
files and exports a side-by-side CSV for human reviewers (NOAH/UPRI staff
or partner agencies) to score.

Reviewers score each pair on:
  - Clarity        (1–5): Is it easy to understand?
  - Usefulness     (1–5): Does it help decision-making?
  - Accuracy       (1–5): Does it faithfully reflect the data?
  - Risk of misinterpretation (1–5): Could it be misread? (5 = very risky)
  - Preferred      (llm / fallback / equal): Which is better overall?

Usage:
    python manage.py human_eval_export
    python manage.py human_eval_export --limit 20
    python manage.py human_eval_export --output review_sheet.csv
"""

import csv
import re
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

from ibff_summarizer.llm_pipeline import build_fallback_summary, generate_forecast_summary
from ibff_summarizer.management.commands.eval_from_csv import csv_to_forecast_input

DEFAULT_CSV_DIR = Path(__file__).resolve().parents[3] / 'csv'
DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / 'human_eval_export.csv'


class Command(BaseCommand):
    help = 'Export side-by-side LLM vs fallback summaries for human review.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-dir', type=Path, default=DEFAULT_CSV_DIR,
        )
        parser.add_argument(
            '--limit', type=int, default=20,
            help='Number of CSV files to include (default: 20).',
        )
        parser.add_argument(
            '--output', type=Path, default=DEFAULT_OUTPUT,
            help=f'Output CSV path (default: {DEFAULT_OUTPUT})',
        )

    def handle(self, *args, **options):
        csv_dir: Path = options['csv_dir']
        limit: int = options['limit']
        output: Path = options['output']

        all_files = sorted(csv_dir.glob('*.csv'))
        if not all_files:
            self.stdout.write(self.style.ERROR(f'No CSV files found in {csv_dir}'))
            return

        step = len(all_files) // limit if limit < len(all_files) else 1
        files = all_files[::step][:limit]

        rows = []
        for i, csv_path in enumerate(files, 1):
            self.stdout.write(f'  [{i}/{len(files)}] {csv_path.name}')
            inp = csv_to_forecast_input(csv_path)

            # Always get both versions
            llm_result = generate_forecast_summary(inp)
            fallback_result = build_fallback_summary(inp)
            fallback_result['_source'] = 'fallback'

            # Strip HTML tags for readability in the spreadsheet
            def plain(text: str) -> str:
                return re.sub(r'<[^>]+>', '', text or '').strip()

            rows.append({
                'file': csv_path.name,
                'forecast_timestamp': inp.get('forecast_timestamp', ''),
                'affected_barangays': inp.get('affected_barangays', 0),
                'affected_provinces': inp.get('affected_provinces', 0),
                'affected_municipalities': inp.get('affected_municipalities', 0),
                'top_provinces': ', '.join(
                    f"{a['province']} ({a['affected_barangays']})"
                    for a in inp.get('top_areas', [])
                ),
                'top_cities': ', '.join(
                    f"{c['city']} ({c['affected_barangays']})"
                    for c in inp.get('top_cities', [])
                ),

                # LLM output
                'llm_source': llm_result.get('_source', '?'),
                'llm_executive_summary': plain(llm_result.get('executive_summary', '')),
                'llm_area_summary': plain(llm_result.get('area_summary', '')),

                # Fallback output
                'fallback_executive_summary': plain(fallback_result.get('executive_summary', '')),
                'fallback_area_summary': plain(fallback_result.get('area_summary', '')),

                # Reviewer columns (left blank for human to fill in)
                'reviewer_name': '',
                'llm_clarity_1_5': '',
                'llm_usefulness_1_5': '',
                'llm_accuracy_1_5': '',
                'llm_misinterpretation_risk_1_5': '',
                'fallback_clarity_1_5': '',
                'fallback_usefulness_1_5': '',
                'fallback_accuracy_1_5': '',
                'fallback_misinterpretation_risk_1_5': '',
                'preferred': '',
                'notes': '',
            })

        fieldnames = list(rows[0].keys()) if rows else []
        with open(output, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        self.stdout.write(self.style.SUCCESS(f'\nExported {len(rows)} rows to {output}'))
        self.stdout.write('Share this file with NOAH/UPRI reviewers to score each pair.')
