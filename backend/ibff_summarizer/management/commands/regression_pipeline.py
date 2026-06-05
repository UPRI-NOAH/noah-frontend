"""
Management command: regression_pipeline

Saves LLM pipeline outputs as a baseline, then on future runs detects
regressions by comparing current outputs against the saved baseline.

Usage:
    python manage.py regression_pipeline --record   # save current outputs as baseline
    python manage.py regression_pipeline            # compare current outputs to baseline
    python manage.py regression_pipeline --verbose  # show full diff on failures
"""

import json
import os
from pathlib import Path

from django.core.management.base import BaseCommand

from ibff_summarizer.llm_pipeline import generate_forecast_summary

FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / 'regression_fixtures'

REGRESSION_INPUTS = [
    {
        'id': 'single_province_single_brgy',
        'label': 'Single province, single barangay',
        'input': {
            'forecast_timestamp': 'May 13, 2026 - 08:00:00',
            'model_run': '00Z',
            'affected_barangays': 1,
            'affected_municipalities': 1,
            'affected_provinces': 1,
            'top_areas': [{'province': 'Negros Oriental', 'affected_barangays': 1}],
            'top_cities': [{'city': 'Dumaguete City', 'affected_barangays': 1}],
            'highest_hazard_level': 'High',
            'notes': ['Counts exclude barangays tagged Little to None.'],
        },
    },
    {
        'id': 'multi_province_multi_city',
        'label': 'Multiple provinces and cities',
        'input': {
            'forecast_timestamp': 'May 13, 2026 - 13:00:00',
            'model_run': '05Z',
            'affected_barangays': 41,
            'affected_municipalities': 4,
            'affected_provinces': 2,
            'top_areas': [
                {'province': 'Negros Oriental', 'affected_barangays': 30},
                {'province': 'Cebu', 'affected_barangays': 11},
            ],
            'top_cities': [
                {'city': 'Dumaguete City', 'affected_barangays': 9},
                {'city': 'Valencia', 'affected_barangays': 9},
                {'city': 'Sibulan', 'affected_barangays': 7},
            ],
            'highest_hazard_level': 'High',
            'notes': ['Counts exclude barangays tagged Little to None.'],
        },
    },
    {
        'id': 'zero_affected',
        'label': 'Zero affected barangays',
        'input': {
            'forecast_timestamp': 'May 13, 2026 - 08:00:00',
            'model_run': '00Z',
            'affected_barangays': 0,
            'affected_municipalities': 0,
            'affected_provinces': 0,
            'top_areas': [],
            'top_cities': [],
            'highest_hazard_level': '',
            'notes': [],
        },
    },
    {
        'id': 'large_event',
        'label': 'Large event — many provinces and cities',
        'input': {
            'forecast_timestamp': 'May 14, 2026 - 08:00:00',
            'model_run': '00Z',
            'affected_barangays': 284,
            'affected_municipalities': 37,
            'affected_provinces': 8,
            'top_areas': [
                {'province': 'Cagayan', 'affected_barangays': 88},
                {'province': 'Isabela', 'affected_barangays': 72},
                {'province': 'Nueva Vizcaya', 'affected_barangays': 45},
            ],
            'top_cities': [
                {'city': 'Tuguegarao City', 'affected_barangays': 20},
                {'city': 'Ilagan City', 'affected_barangays': 15},
            ],
            'highest_hazard_level': 'High',
            'notes': ['Counts exclude barangays tagged Little to None.'],
        },
    },
    {
        'id': 'singular_city_brgy',
        'label': 'City with exactly 1 barangay',
        'input': {
            'forecast_timestamp': 'May 13, 2026 - 08:00:00',
            'model_run': '00Z',
            'affected_barangays': 3,
            'affected_municipalities': 2,
            'affected_provinces': 1,
            'top_areas': [{'province': 'Negros Oriental', 'affected_barangays': 3}],
            'top_cities': [
                {'city': 'Sibulan', 'affected_barangays': 2},
                {'city': 'Dauin', 'affected_barangays': 1},
            ],
            'highest_hazard_level': 'High',
            'notes': [],
        },
    },
]

COMPARE_KEYS = ['executive_summary', 'area_summary', 'caveat']


def _baseline_path(fixture_id: str) -> Path:
    return FIXTURES_DIR / f'{fixture_id}.json'


def _load_baseline(fixture_id: str) -> dict | None:
    path = _baseline_path(fixture_id)
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def _save_baseline(fixture_id: str, result: dict, label: str) -> None:
    FIXTURES_DIR.mkdir(exist_ok=True)
    baseline = {
        'id': fixture_id,
        'label': label,
        'source': result.get('_source'),
        'outputs': {k: result.get(k, '') for k in COMPARE_KEYS},
    }
    with open(_baseline_path(fixture_id), 'w') as f:
        json.dump(baseline, f, indent=2)


def _diff_lines(old: str, new: str) -> list[str]:
    old_lines = old.splitlines()
    new_lines = new.splitlines()
    diffs = []
    for i, (o, n) in enumerate(zip(old_lines, new_lines)):
        if o != n:
            diffs.append(f'  line {i+1}:')
            diffs.append(f'    - {o}')
            diffs.append(f'    + {n}')
    if len(old_lines) != len(new_lines):
        diffs.append(f'  line count changed: {len(old_lines)} → {len(new_lines)}')
    return diffs


class Command(BaseCommand):
    help = 'Record or compare LLM pipeline outputs for regression testing.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--record', action='store_true',
            help='Record current outputs as the regression baseline.'
        )
        parser.add_argument(
            '--verbose', action='store_true',
            help='Show full diff for regressions.'
        )

    def handle(self, *args, **options):
        record = options['record']
        verbose = options['verbose']

        self.stdout.write('\n' + '=' * 60)
        if record:
            self.stdout.write('  IBFF LLM Pipeline — Recording Baseline')
        else:
            self.stdout.write('  IBFF LLM Pipeline — Regression Check')
        self.stdout.write('=' * 60)

        if record:
            self._record(verbose)
        else:
            self._compare(verbose)

    def _record(self, verbose: bool) -> None:
        for fixture in REGRESSION_INPUTS:
            fid = fixture['id']
            label = fixture['label']
            result = generate_forecast_summary(fixture['input'])
            _save_baseline(fid, result, label)
            source = result.get('_source', '?')
            self.stdout.write(
                self.style.SUCCESS(f'\n  ✓ Recorded [{source}] {label}')
            )
            if verbose:
                for k in COMPARE_KEYS:
                    self.stdout.write(f'    {k}: {result.get(k, "")[:80]}...')

        self.stdout.write(f'\n  Baseline saved to: {FIXTURES_DIR}')
        self.stdout.write('=' * 60 + '\n')

    def _compare(self, verbose: bool) -> None:
        regressions = 0
        missing = 0

        for fixture in REGRESSION_INPUTS:
            fid = fixture['id']
            label = fixture['label']
            baseline = _load_baseline(fid)

            if baseline is None:
                self.stdout.write(
                    self.style.WARNING(f'\n  [NO BASELINE] {label} — run --record first')
                )
                missing += 1
                continue

            result = generate_forecast_summary(fixture['input'])
            source = result.get('_source', '?')
            baseline_source = baseline.get('source', '?')

            case_regressions = []
            for key in COMPARE_KEYS:
                current = result.get(key, '')
                expected = baseline['outputs'].get(key, '')
                if current != expected:
                    case_regressions.append((key, expected, current))

            source_changed = source != baseline_source

            if not case_regressions and not source_changed:
                self.stdout.write(
                    self.style.SUCCESS(f'\n  [PASS] {label}  ({source})')
                )
            else:
                regressions += 1
                self.stdout.write(
                    self.style.ERROR(f'\n  [REGRESSION] {label}  ({baseline_source} → {source})')
                )
                if source_changed:
                    self.stdout.write(
                        self.style.WARNING(f'    source changed: {baseline_source} → {source}')
                    )
                for key, expected, current in case_regressions:
                    self.stdout.write(self.style.ERROR(f'    {key} changed'))
                    if verbose:
                        for line in _diff_lines(expected, current):
                            self.stdout.write(f'      {line}')

        self.stdout.write('\n' + '=' * 60)
        if missing:
            self.stdout.write(
                self.style.WARNING(f'  {missing} case(s) have no baseline — run --record first.')
            )
        elif regressions == 0:
            self.stdout.write(self.style.SUCCESS(f'  No regressions detected. All {len(REGRESSION_INPUTS)} cases match baseline.'))
        else:
            self.stdout.write(
                self.style.ERROR(f'  {regressions}/{len(REGRESSION_INPUTS)} case(s) regressed.')
            )
        self.stdout.write('=' * 60 + '\n')
