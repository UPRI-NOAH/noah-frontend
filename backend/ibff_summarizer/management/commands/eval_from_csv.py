"""
Management command: eval_from_csv

Loads real forecast CSV files from backend/csv/, aggregates each into a
ForecastSummaryInput, runs it through generate_forecast_summary, and reports
faithfulness scores across all processed files.

Usage:
    python manage.py eval_from_csv
    python manage.py eval_from_csv --csv-dir path/to/csv
    python manage.py eval_from_csv --file path/to/file.csv
    python manage.py eval_from_csv --limit 10
    python manage.py eval_from_csv --verbose
"""

import csv
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

from ibff_summarizer.llm_pipeline import generate_forecast_summary

DEFAULT_CSV_DIR = Path(__file__).resolve().parents[3] / 'csv'

FORBIDDEN_TERMS = [
    'catastrophic', 'devastating', 'life-threatening', 'crisis',
    'emergency', 'evacuate immediately', 'storm surge', 'landslide',
    'casualties', 'deaths', 'destroyed',
]


# ---------------------------------------------------------------------------
# CSV parsing
# ---------------------------------------------------------------------------

def _parse_timestamp(filename: str) -> tuple[str, str]:
    """Extract human-readable timestamp and model_run from a CSV filename."""
    match = re.search(r'(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})', filename)
    if not match:
        return 'not available', 'not available'
    date_str, time_str = match.group(1), match.group(2)
    try:
        dt = datetime.strptime(f'{date_str} {time_str}', '%Y-%m-%d %H-%M-%S')
    except ValueError:
        return 'not available', 'not available'
    timestamp = dt.strftime('%B %-d, %Y - %H:%M:%S')
    model_run = f'{(dt.hour // 6) * 6:02d}Z'
    return timestamp, model_run


def _clean_municipality(name: str) -> str:
    """Strip parenthetical suffixes like '(Capital)' and title-case."""
    name = re.sub(r'\s*\(.*?\)', '', name).strip()
    return name.title()


def csv_to_forecast_input(csv_path: Path) -> dict:
    """
    Read a barangay CSV and return a ForecastSummaryInput dict.

    Each row = 1 affected barangay. Aggregates province and municipality
    counts; derives highest hazard level from High/Medium column values.
    """
    provinces: Counter = Counter()
    municipalities: Counter = Counter()
    has_high = False
    has_medium = False

    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_province = (row.get('Province') or '').strip()
            raw_municipality = (row.get('Municipality') or '').strip()
            if not raw_province:
                continue
            province = raw_province.title()
            municipality = _clean_municipality(raw_municipality)
            provinces[province] += 1
            municipalities[municipality] += 1

            try:
                if float(row.get('High') or 0) > 0:
                    has_high = True
                if float(row.get('Medium') or 0) > 0:
                    has_medium = True
            except (ValueError, TypeError):
                pass

    timestamp, model_run = _parse_timestamp(csv_path.name)

    if not provinces:
        return {
            'forecast_timestamp': timestamp,
            'model_run': model_run,
            'affected_barangays': 0,
            'affected_municipalities': 0,
            'affected_provinces': 0,
            'top_areas': [],
            'top_cities': [],
            'highest_hazard_level': '',
            'notes': [],
        }

    total_barangays = sum(provinces.values())
    top_areas = [
        {'province': p, 'affected_barangays': c}
        for p, c in provinces.most_common(5)
    ]
    top_cities = [
        {'city': m, 'affected_barangays': c}
        for m, c in municipalities.most_common(5)
    ]
    hazard = 'High' if has_high else ('Medium' if has_medium else 'Low')

    return {
        'forecast_timestamp': timestamp,
        'model_run': model_run,
        'affected_barangays': total_barangays,
        'affected_municipalities': len(municipalities),
        'affected_provinces': len(provinces),
        'top_areas': top_areas,
        'top_cities': top_cities,
        'highest_hazard_level': hazard,
        'notes': ['Counts exclude barangays tagged Little to None.'],
    }


# ---------------------------------------------------------------------------
# Faithfulness scoring
# ---------------------------------------------------------------------------

@dataclass
class FaithfulnessScore:
    filename: str = ''
    source: str = 'fallback'

    numbers_total: int = 0
    numbers_found: int = 0
    numbers_missing: list[str] = field(default_factory=list)

    entities_total: int = 0
    entities_found: int = 0
    entities_missing: list[str] = field(default_factory=list)

    hallucinated_numbers: list[str] = field(default_factory=list)
    # Maps each hallucinated number → the sentence it appeared in
    hallucination_context: dict[str, str] = field(default_factory=dict)
    forbidden_found: list[str] = field(default_factory=list)
    caveat_correct: bool = True


EXPECTED_CAVEAT = (
    'These results are indicative, based on forecast rainfall exceeding river basin thresholds '
    'and the mapped flood exposure of barangays within affected basins. '
    'This does not confirm actual flooding on the ground. '
    'For official advisories, please coordinate with your Local Government Unit (LGU).'
)


def score(inp: dict, result: dict, filename: str) -> FaithfulnessScore:
    fs = FaithfulnessScore(
        filename=filename,
        source=result.get('_source', 'fallback'),
    )

    output_text = (
        result.get('executive_summary', '') + ' ' +
        result.get('area_summary', '')
    )

    # Number faithfulness — only check the key aggregated numbers
    key_numbers: set[str] = set()
    for key in ('affected_barangays', 'affected_municipalities', 'affected_provinces'):
        val = inp.get(key)
        if val and val > 0:
            key_numbers.add(str(val))
    for area in inp.get('top_areas', []):
        key_numbers.add(str(area['affected_barangays']))
    for city in inp.get('top_cities', []):
        key_numbers.add(str(city['affected_barangays']))

    fs.numbers_total = len(key_numbers)
    output_numbers = set(re.findall(r'\b\d+\b', output_text))
    for n in key_numbers:
        if n in output_text:
            fs.numbers_found += 1
        else:
            fs.numbers_missing.append(n)

    # Hallucinated numbers: only meaningful for LLM output — fallback is deterministic
    if fs.source == 'llm':
        all_input_numbers = set(re.findall(r'\b\d+\b', json.dumps(inp)))
        fs.hallucinated_numbers = sorted(output_numbers - all_input_numbers)

        sentences = re.split(r'(?<=[.!?])\s+', output_text)
        for num in fs.hallucinated_numbers:
            for sent in sentences:
                if re.search(rf'\b{re.escape(num)}\b', sent):
                    fs.hallucination_context[num] = sent.strip()
                    break

    # Entity recall
    entities = (
        [a['province'] for a in inp.get('top_areas', [])] +
        [c['city'] for c in inp.get('top_cities', [])]
    )
    fs.entities_total = len(entities)
    for entity in entities:
        if entity in output_text:
            fs.entities_found += 1
        else:
            fs.entities_missing.append(entity)

    # Forbidden terms
    full_lower = output_text.lower()
    fs.forbidden_found = [t for t in FORBIDDEN_TERMS if t in full_lower]

    # Caveat correctness
    fs.caveat_correct = result.get('caveat', '').strip() == EXPECTED_CAVEAT.strip()

    return fs


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = 'Evaluate LLM pipeline faithfulness using real CSV forecast files.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-dir', type=Path, default=DEFAULT_CSV_DIR,
            help=f'Directory containing CSV files (default: {DEFAULT_CSV_DIR})',
        )
        parser.add_argument(
            '--file', type=Path, default=None,
            help='Evaluate a single CSV file instead of a directory.',
        )
        parser.add_argument(
            '--limit', type=int, default=10,
            help='Max number of CSV files to evaluate (default: 10). Use 0 for all.',
        )
        parser.add_argument(
            '--verbose', action='store_true',
            help='Print full output text for each file.',
        )

    def handle(self, *args, **options):
        verbose = options['verbose']
        single_file: Path | None = options['file']
        limit: int = options['limit']
        csv_dir: Path = options['csv_dir']

        if single_file:
            files = [single_file]
        else:
            all_files = sorted(csv_dir.glob('*.csv'))
            if not all_files:
                self.stdout.write(self.style.ERROR(f'No CSV files found in {csv_dir}'))
                return
            if limit and limit < len(all_files):
                # Sample evenly across the full date range
                step = len(all_files) // limit
                files = all_files[::step][:limit]
            else:
                files = all_files

        self.stdout.write('\n' + '=' * 65)
        self.stdout.write('  IBFF LLM Pipeline — CSV Faithfulness Evaluation')
        self.stdout.write(f'  Files: {len(files)}  |  Source dir: {csv_dir}')
        self.stdout.write('=' * 65)

        scores: list[FaithfulnessScore] = []

        for csv_path in files:
            inp = csv_to_forecast_input(csv_path)
            result = generate_forecast_summary(inp)
            fs = score(inp, result, csv_path.name)
            scores.append(fs)

            brgy = inp['affected_barangays']
            num_acc = (fs.numbers_found / fs.numbers_total * 100) if fs.numbers_total else 100.0
            ent_rec = (fs.entities_found / fs.entities_total * 100) if fs.entities_total else 100.0

            has_issues = (
                fs.numbers_missing or
                fs.hallucinated_numbers or
                fs.entities_missing or
                fs.forbidden_found or
                not fs.caveat_correct
            )
            status = self.style.ERROR('ISSUES') if has_issues else self.style.SUCCESS('OK')

            self.stdout.write(f'\n[{status}] {csv_path.name}  ({fs.source})')
            self.stdout.write(f'       Barangays   : {brgy} across {inp["affected_provinces"]} province(s), {inp["affected_municipalities"]} municipality/ies')
            self.stdout.write(f'       Num accuracy: {num_acc:.0f}%  ({fs.numbers_found}/{fs.numbers_total})')
            self.stdout.write(f'       Entity recall: {ent_rec:.0f}%  ({fs.entities_found}/{fs.entities_total})')

            if fs.hallucinated_numbers:
                self.stdout.write(self.style.WARNING(f'       Hallucinated numbers : {fs.hallucinated_numbers}'))
            if fs.numbers_missing:
                self.stdout.write(self.style.ERROR(f'       Missing numbers      : {fs.numbers_missing}'))
            if fs.entities_missing:
                self.stdout.write(self.style.ERROR(f'       Missing entities     : {fs.entities_missing}'))
            if fs.forbidden_found:
                self.stdout.write(self.style.ERROR(f'       Forbidden terms      : {fs.forbidden_found}'))
            if not fs.caveat_correct:
                self.stdout.write(self.style.WARNING('       Caveat text is outdated or incorrect'))

            if verbose:
                self.stdout.write(f'\n  Input  : {json.dumps(inp, indent=4)}')
                self.stdout.write(f'\n  Output : {json.dumps(result, indent=4)}')

        # --- Aggregate report ---
        if not scores:
            return

        non_zero_num = [s for s in scores if s.numbers_total > 0]
        avg_num_acc = (
            sum(s.numbers_found / s.numbers_total for s in non_zero_num) / len(non_zero_num) * 100
            if non_zero_num else 100.0
        )
        non_zero_ent = [s for s in scores if s.entities_total > 0]
        avg_ent_rec = (
            sum(s.entities_found / s.entities_total for s in non_zero_ent) / len(non_zero_ent) * 100
            if non_zero_ent else 100.0
        )
        hallucination_cases = sum(1 for s in scores if s.hallucinated_numbers)
        forbidden_cases = sum(1 for s in scores if s.forbidden_found)
        caveat_wrong = sum(1 for s in scores if not s.caveat_correct)
        llm_cases = sum(1 for s in scores if s.source == 'llm')
        clean_cases = sum(
            1 for s in scores
            if not s.numbers_missing and not s.hallucinated_numbers
            and not s.entities_missing and not s.forbidden_found
            and s.caveat_correct
        )

        # Frequency of each hallucinated number + one example context per number
        halluc_freq: Counter = Counter()
        halluc_example: dict[str, str] = {}
        for s in scores:
            for num in s.hallucinated_numbers:
                halluc_freq[num] += 1
                if num not in halluc_example and num in s.hallucination_context:
                    halluc_example[num] = s.hallucination_context[num]

        self.stdout.write('\n' + '=' * 65)
        self.stdout.write('  AGGREGATE FAITHFULNESS REPORT')
        self.stdout.write('-' * 65)
        self.stdout.write(f'  Files evaluated    : {len(scores)}')
        self.stdout.write(f'  LLM used           : {llm_cases}/{len(scores)}  ({llm_cases/len(scores)*100:.0f}%)')
        self.stdout.write(f'  Number accuracy    : {avg_num_acc:.1f}%  (avg across files with data)')
        self.stdout.write(f'  Entity recall      : {avg_ent_rec:.1f}%  (avg across files with data)')
        self.stdout.write(f'  Hallucination rate : {hallucination_cases}/{len(scores)}  ({hallucination_cases/len(scores)*100:.0f}% of files had invented numbers)')
        self.stdout.write(f'  Forbidden terms    : {forbidden_cases}/{len(scores)}  ({forbidden_cases/len(scores)*100:.0f}%)')
        self.stdout.write(f'  Caveat correct     : {len(scores)-caveat_wrong}/{len(scores)}')
        self.stdout.write(f'  Fully clean        : {clean_cases}/{len(scores)}  ({clean_cases/len(scores)*100:.0f}%)')

        if halluc_freq:
            self.stdout.write('\n  TOP HALLUCINATED NUMBERS (most frequent first)')
            self.stdout.write('-' * 65)
            for num, count in halluc_freq.most_common(15):
                pct = count / len(scores) * 100
                example = halluc_example.get(num, '')
                # Truncate long example sentences
                if len(example) > 80:
                    example = example[:77] + '...'
                self.stdout.write(
                    self.style.WARNING(f'  "{num}"  — {count} files ({pct:.0f}%)')
                )
                if example:
                    self.stdout.write(f'         e.g. "{example}"')

        self.stdout.write('=' * 65 + '\n')
