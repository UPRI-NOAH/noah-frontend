"""
Management command: eval_llm_pipeline

Runs a fixture of forecast inputs through generate_forecast_summary and
reports faithfulness scores:

  - number_accuracy   : % of input numbers that appear correctly in output
  - entity_recall     : % of provinces/cities from input that appear in output
  - hallucination_rate: % of runs where LLM invented numbers or locations
  - llm_pass_rate     : % of runs that used LLM (not fallback)

Usage:
    python manage.py eval_llm_pipeline
    python manage.py eval_llm_pipeline --verbose
"""

import json
import re
from dataclasses import dataclass, field

from django.core.management.base import BaseCommand

from ibff_summarizer.llm_pipeline import FORBIDDEN_TERMS, generate_forecast_summary

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FIXTURES = [
    {
        'label': 'Single province, single municipality, single barangay',
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
        'expect': {
            'singular_barangay_in_exec': True,
            'singular_municipality_in_exec': True,
            'singular_province_in_exec': True,
            'province_singular_in_area': True,
            'numbers_exact': ['1'],
            'province_in_area': ['Negros Oriental'],
            'city_in_area': ['Dumaguete City'],
            'bold_province': ['Negros Oriental'],
            'bold_city': ['Dumaguete City'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
        },
    },
    {
        'label': 'Multiple provinces, multiple cities',
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
        'expect': {
            'plural_province_in_area': True,
            'numbers_exact': ['41', '4', '2', '30', '11', '9', '7'],
            'province_in_area': ['Negros Oriental', 'Cebu'],
            'city_in_area': ['Dumaguete City', 'Valencia', 'Sibulan'],
            'bold_province': ['Negros Oriental', 'Cebu'],
            'bold_city': ['Dumaguete City', 'Valencia', 'Sibulan'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
        },
    },
    {
        'label': 'Zero affected barangays (no active forecast)',
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
        'expect': {
            'exec_contains': ['no barangays'],
            'area_summary_empty': True,
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
        },
    },
    {
        'label': 'Large event — numbers preserved exactly',
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
        'expect': {
            'numbers_exact': ['284', '37', '8', '88', '72', '45', '20', '15'],
            'province_in_area': ['Cagayan', 'Isabela', 'Nueva Vizcaya'],
            'city_in_area': ['Tuguegarao City', 'Ilagan City'],
            'bold_province': ['Cagayan', 'Isabela', 'Nueva Vizcaya'],
            'bold_city': ['Tuguegarao City', 'Ilagan City'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
        },
    },
    {
        'label': 'Singular barangay count per city',
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
        'expect': {
            'singular_barangay_city': 'Dauin',
            'province_in_area': ['Negros Oriental'],
            'city_in_area': ['Sibulan', 'Dauin'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
        },
    },
]

# ---------------------------------------------------------------------------
# Rule checks (pass/fail)
# ---------------------------------------------------------------------------

@dataclass
class CheckResult:
    passed: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)


def _check(result: dict, expect: dict) -> CheckResult:
    cr = CheckResult()
    exec_s = result.get('executive_summary', '')
    area_s = result.get('area_summary', '')
    caveat = result.get('caveat', '')
    full = (exec_s + ' ' + area_s).lower()

    def ok(name): cr.passed.append(name)
    def fail(name, detail=''): cr.failed.append(f'{name}{": " + detail if detail else ""}')

    if expect.get('singular_barangay_in_exec'):
        if re.search(r'\b1 barangay\b', exec_s) and '1 barangays' not in exec_s:
            ok('singular barangay in exec')
        else:
            fail('singular barangay in exec', f'got: {exec_s!r}')

    if expect.get('singular_municipality_in_exec'):
        if re.search(r'\b1 municipality\b', exec_s) and '1 municipalities' not in exec_s:
            ok('singular municipality in exec')
        else:
            fail('singular municipality in exec', f'got: {exec_s!r}')

    if expect.get('singular_province_in_exec'):
        if re.search(r'\b1 province\b', exec_s) and '1 provinces' not in exec_s:
            ok('singular province in exec')
        else:
            fail('singular province in exec', f'got: {exec_s!r}')

    if expect.get('province_singular_in_area'):
        if re.search(r'The following province has', area_s, re.IGNORECASE):
            ok('province singular in area_summary')
        else:
            fail('province singular in area_summary', f'got: {area_s!r}')

    if expect.get('plural_province_in_area'):
        if re.search(r'The following provinces have', area_s, re.IGNORECASE):
            ok('provinces plural in area_summary')
        else:
            fail('provinces plural in area_summary', f'got: {area_s!r}')

    for num in expect.get('numbers_exact', []):
        if num in exec_s or num in area_s:
            ok(f'number {num} present')
        else:
            fail(f'number {num} missing')

    for province in expect.get('province_in_area', []):
        if province in area_s:
            ok(f'province "{province}" in area_summary')
        else:
            fail(f'province "{province}" missing from area_summary')

    for city in expect.get('city_in_area', []):
        if city in area_s:
            ok(f'city "{city}" in area_summary')
        else:
            fail(f'city "{city}" missing from area_summary')

    for province in expect.get('bold_province', []):
        if f'<strong>{province}</strong>' in area_s:
            ok(f'province "{province}" is bold')
        else:
            fail(f'province "{province}" not bold')

    for city in expect.get('bold_city', []):
        if f'<strong>{city}</strong>' in area_s:
            ok(f'city "{city}" is bold')
        else:
            fail(f'city "{city}" not bold')

    if expect.get('area_summary_empty'):
        if not area_s.strip():
            ok('area_summary empty for zero-data case')
        else:
            fail('area_summary should be empty', f'got: {area_s!r}')

    for phrase in expect.get('exec_contains', []):
        if phrase.lower() in exec_s.lower():
            ok(f'exec contains "{phrase}"')
        else:
            fail(f'exec missing "{phrase}"', f'got: {exec_s!r}')

    if expect.get('no_forbidden_terms'):
        found = [t for t in FORBIDDEN_TERMS if t in full]
        if not found:
            ok('no forbidden terms')
        else:
            fail('forbidden terms found', str(found))

    if expect.get('caveat_non_empty'):
        if caveat.strip():
            ok('caveat non-empty')
        else:
            fail('caveat is empty')

    singular_city = expect.get('singular_barangay_city')
    if singular_city:
        pattern = rf'{re.escape(singular_city)}.*?1 barangay\b'
        if re.search(pattern, area_s) and f'{singular_city}.*?1 barangays' not in area_s:
            ok(f'singular barangay for {singular_city}')
        else:
            fail(f'singular barangay for {singular_city}', f'got: {area_s!r}')

    return cr


# ---------------------------------------------------------------------------
# Faithfulness scoring
# ---------------------------------------------------------------------------

@dataclass
class FaithfulnessScore:
    # number_accuracy: fraction of input numbers found in output
    numbers_total: int = 0
    numbers_found: int = 0
    numbers_missing: list[str] = field(default_factory=list)

    # entity_recall: fraction of provinces+cities found in output
    entities_total: int = 0
    entities_found: int = 0
    entities_missing: list[str] = field(default_factory=list)

    # hallucination: numbers in output that are NOT in input
    hallucinated_numbers: list[str] = field(default_factory=list)

    # whether LLM or fallback was used
    source: str = 'fallback'


def _score_faithfulness(result: dict, inp: dict) -> FaithfulnessScore:
    score = FaithfulnessScore(source=result.get('_source', 'fallback'))
    output_text = (
        result.get('executive_summary', '') + ' ' +
        result.get('area_summary', '')
    )

    # --- number accuracy ---
    input_numbers = set(re.findall(r'\b\d+(?:\.\d+)?\b', json.dumps(inp)))
    output_numbers = set(re.findall(r'\b\d+(?:\.\d+)?\b', output_text))

    score.numbers_total = len(input_numbers)
    for n in input_numbers:
        if n in output_text:
            score.numbers_found += 1
        else:
            score.numbers_missing.append(n)

    # hallucinated = numbers in output not present in input at all
    score.hallucinated_numbers = sorted(output_numbers - input_numbers)

    # --- entity recall ---
    provinces = [a['province'] for a in inp.get('top_areas', [])]
    cities = [c['city'] for c in inp.get('top_cities', [])]
    entities = provinces + cities
    score.entities_total = len(entities)

    for entity in entities:
        if entity in output_text:
            score.entities_found += 1
        else:
            score.entities_missing.append(entity)

    return score


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = 'Evaluate LLM pipeline faithfulness and accuracy.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose', action='store_true',
            help='Print passed rule checks and per-case score details.'
        )

    def handle(self, *args, **options):
        verbose = options['verbose']

        total_checks = 0
        total_passed = 0
        case_results = []
        faith_scores: list[FaithfulnessScore] = []

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('  IBFF LLM Pipeline — Accuracy Evaluation')
        self.stdout.write('=' * 60)

        for fixture in FIXTURES:
            label = fixture['label']
            inp = fixture['input']
            result = generate_forecast_summary(inp)
            source = result.get('_source', '?')

            cr = _check(result, fixture['expect'])
            fs = _score_faithfulness(result, inp)
            faith_scores.append(fs)

            passed = len(cr.passed)
            failed = len(cr.failed)
            total = passed + failed
            total_checks += total
            total_passed += passed
            case_results.append((label, source, passed, total, cr))

            num_acc = (fs.numbers_found / fs.numbers_total * 100) if fs.numbers_total else 100
            ent_rec = (fs.entities_found / fs.entities_total * 100) if fs.entities_total else 100

            status = self.style.SUCCESS('PASS') if failed == 0 else self.style.ERROR('FAIL')
            self.stdout.write(f'\n[{status}] {label}  ({source})')
            self.stdout.write(f'       Rule checks : {passed}/{total} passed')
            self.stdout.write(f'       Num accuracy: {num_acc:.0f}%  ({fs.numbers_found}/{fs.numbers_total} numbers correct)')
            self.stdout.write(f'       Entity recall: {ent_rec:.0f}%  ({fs.entities_found}/{fs.entities_total} locations present)')

            if fs.hallucinated_numbers:
                self.stdout.write(
                    self.style.WARNING(f'       Hallucinated numbers: {fs.hallucinated_numbers}')
                )
            if fs.numbers_missing and verbose:
                self.stdout.write(f'       Missing numbers: {fs.numbers_missing}')
            if fs.entities_missing:
                self.stdout.write(
                    self.style.ERROR(f'       Missing entities: {fs.entities_missing}')
                )
            if failed > 0:
                for f in cr.failed:
                    self.stdout.write(self.style.ERROR(f'  ✗ {f}'))
            if verbose and cr.passed:
                for p in cr.passed:
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {p}'))

        # --- aggregate faithfulness scores ---
        non_zero = [f for f in faith_scores if f.numbers_total > 0]
        avg_num_acc = (
            sum(f.numbers_found / f.numbers_total for f in non_zero) / len(non_zero) * 100
            if non_zero else 100
        )
        non_zero_ent = [f for f in faith_scores if f.entities_total > 0]
        avg_ent_rec = (
            sum(f.entities_found / f.entities_total for f in non_zero_ent) / len(non_zero_ent) * 100
            if non_zero_ent else 100
        )
        hallucination_cases = sum(1 for f in faith_scores if f.hallucinated_numbers)
        hallucination_rate = hallucination_cases / len(faith_scores) * 100
        llm_cases = sum(1 for f in faith_scores if f.source == 'llm')
        llm_pass_rate = llm_cases / len(faith_scores) * 100

        rule_pct = round(100 * total_passed / total_checks) if total_checks else 0
        cases_passed = sum(1 for _, _, p, t, _ in case_results if p == t)

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('  FAITHFULNESS SCORES')
        self.stdout.write('-' * 60)
        self.stdout.write(f'  Number accuracy    : {avg_num_acc:.1f}%')
        self.stdout.write(f'  Entity recall      : {avg_ent_rec:.1f}%')
        self.stdout.write(f'  Hallucination rate : {hallucination_rate:.0f}%  ({hallucination_cases}/{len(faith_scores)} cases)')
        self.stdout.write(f'  LLM pass rate      : {llm_pass_rate:.0f}%  ({llm_cases}/{len(faith_scores)} used LLM)')
        self.stdout.write('-' * 60)
        self.stdout.write('  RULE COMPLIANCE')
        self.stdout.write('-' * 60)
        self.stdout.write(f'  Checks passed      : {total_passed}/{total_checks}  ({rule_pct}%)')
        self.stdout.write(f'  Cases fully passing: {cases_passed}/{len(FIXTURES)}')
        self.stdout.write('=' * 60 + '\n')
