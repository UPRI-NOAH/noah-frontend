"""
Management command: eval_past_event_pipeline

Runs fixture past-event inputs through build_historical_fallback (the
deterministic path used by generate_past_event_summary) and reports whether
the output meets the structural and content rules.

Checks the same things eval_llm_pipeline.py checks for the forecast pipeline:
  - executive_summary format (two-part structure, correct counts)
  - no province/municipality names leaked into executive_summary Part 1
  - singular/plural agreement (municipality, province)
  - province names present and bolded in area_summary
  - municipality names present and bolded in area_summary
  - no forbidden terms
  - caveat is non-empty and contains the right counts

Usage:
    python manage.py eval_past_event_pipeline
    python manage.py eval_past_event_pipeline --verbose
"""

import re
from dataclasses import dataclass, field

from django.core.management.base import BaseCommand

from ibff_summarizer.past_event_pipeline import (
    _HISTORICAL_FORBIDDEN_TERMS,
    build_historical_fallback,
)

# ---------------------------------------------------------------------------
# Fixtures — mimic build_historical_summary_input() output
# ---------------------------------------------------------------------------

FIXTURES = [
    {
        'label': 'Large event — Kristine-like (45 total, 12 confirmed, 3 provinces)',
        'input': {
            'event_name': 'Typhoon Kristine',
            'event_date': 'October 22, 2024',
            'total_municipalities': 45,
            'confirmed_municipalities': 12,
            'confirmed_provinces': 3,
            'top_areas': [
                {'province': 'Batangas', 'confirmed_municipalities': 5},
                {'province': 'Quezon', 'confirmed_municipalities': 4},
                {'province': 'Cavite', 'confirmed_municipalities': 3},
            ],
            'top_municipalities': [
                {'municipality': 'Balayan', 'province': 'Batangas'},
                {'municipality': 'Lipa', 'province': 'Batangas'},
                {'municipality': 'Lucena', 'province': 'Quezon'},
            ],
        },
        'expect': {
            'exec_total_munis': 45,
            'exec_confirmed_munis': 12,
            'exec_confirmed_provs': 3,
            'exec_no_location_names': True,
            'plural_municipality_in_exec': True,
            'plural_province_in_exec': True,
            'area_province_plural': True,
            'province_in_area': ['Batangas', 'Quezon', 'Cavite'],
            'muni_in_area': ['Balayan', 'Lipa', 'Lucena'],
            'bold_province': ['Batangas', 'Quezon', 'Cavite'],
            'bold_muni': ['Balayan', 'Lipa', 'Lucena'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
            'caveat_contains_counts': True,
        },
    },
    {
        'label': 'Small event (8 total, 3 confirmed, 2 provinces)',
        'input': {
            'event_name': 'Typhoon Tino',
            'event_date': 'November 3-4, 2025',
            'total_municipalities': 8,
            'confirmed_municipalities': 3,
            'confirmed_provinces': 2,
            'top_areas': [
                {'province': 'Cagayan', 'confirmed_municipalities': 2},
                {'province': 'Isabela', 'confirmed_municipalities': 1},
            ],
            'top_municipalities': [
                {'municipality': 'Tuguegarao City', 'province': 'Cagayan'},
                {'municipality': 'Ilagan City', 'province': 'Isabela'},
            ],
        },
        'expect': {
            'exec_total_munis': 8,
            'exec_confirmed_munis': 3,
            'exec_confirmed_provs': 2,
            'exec_no_location_names': True,
            'plural_municipality_in_exec': True,
            'plural_province_in_exec': True,
            'area_province_plural': True,
            'province_in_area': ['Cagayan', 'Isabela'],
            'muni_in_area': ['Tuguegarao City', 'Ilagan City'],
            'bold_province': ['Cagayan', 'Isabela'],
            'bold_muni': ['Tuguegarao City', 'Ilagan City'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
            'caveat_contains_counts': True,
        },
    },
    {
        'label': 'Single province, single confirmed municipality',
        'input': {
            'event_name': 'Typhoon Basyang',
            'event_date': 'February 5, 2026',
            'total_municipalities': 4,
            'confirmed_municipalities': 1,
            'confirmed_provinces': 1,
            'top_areas': [
                {'province': 'Negros Oriental', 'confirmed_municipalities': 1},
            ],
            'top_municipalities': [
                {'municipality': 'Dumaguete City', 'province': 'Negros Oriental'},
            ],
        },
        'expect': {
            'exec_total_munis': 4,
            'exec_confirmed_munis': 1,
            'exec_confirmed_provs': 1,
            'exec_no_location_names': True,
            'plural_municipality_in_exec': False,   # "45 municipalities" but total=4
            'plural_province_in_exec': False,
            'singular_confirmed_municipality': True,
            'singular_confirmed_province': True,
            'area_province_singular': True,
            'province_in_area': ['Negros Oriental'],
            'muni_in_area': ['Dumaguete City'],
            'bold_province': ['Negros Oriental'],
            'bold_muni': ['Dumaguete City'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
            'caveat_contains_counts': True,
        },
    },
    {
        'label': 'Zero confirmed municipalities',
        'input': {
            'event_name': 'Typhoon Ofel',
            'event_date': 'October 15, 2024',
            'total_municipalities': 10,
            'confirmed_municipalities': 0,
            'confirmed_provinces': 0,
            'top_areas': [],
            'top_municipalities': [],
        },
        'expect': {
            'exec_total_munis': 10,
            'exec_no_confirmed_phrase': True,
            'area_summary_empty': True,
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
        },
    },
    {
        'label': 'Single province, multiple municipalities',
        'input': {
            'event_name': 'Typhoon Pepito',
            'event_date': 'November 17, 2024',
            'total_municipalities': 20,
            'confirmed_municipalities': 5,
            'confirmed_provinces': 1,
            'top_areas': [
                {'province': 'Aurora', 'confirmed_municipalities': 5},
            ],
            'top_municipalities': [
                {'municipality': 'Baler', 'province': 'Aurora'},
                {'municipality': 'Casiguran', 'province': 'Aurora'},
                {'municipality': 'Dingalan', 'province': 'Aurora'},
            ],
        },
        'expect': {
            'exec_total_munis': 20,
            'exec_confirmed_munis': 5,
            'exec_confirmed_provs': 1,
            'exec_no_location_names': True,
            'singular_confirmed_province': True,
            'area_province_singular': True,
            'province_in_area': ['Aurora'],
            'muni_in_area': ['Baler', 'Casiguran', 'Dingalan'],
            'bold_province': ['Aurora'],
            'bold_muni': ['Baler', 'Casiguran', 'Dingalan'],
            'no_forbidden_terms': True,
            'caveat_non_empty': True,
            'caveat_contains_counts': True,
        },
    },
]

# ---------------------------------------------------------------------------
# Rule checks
# ---------------------------------------------------------------------------

@dataclass
class CheckResult:
    passed: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)


def _check(result: dict, inp: dict, expect: dict) -> CheckResult:
    cr = CheckResult()
    exec_s = result.get('executive_summary', '')
    area_s = result.get('area_summary', '')
    caveat = result.get('caveat', '')
    full = (exec_s + ' ' + area_s + ' ' + caveat).lower()

    def ok(name): cr.passed.append(name)
    def fail(name, detail=''): cr.failed.append(f'{name}{": " + detail if detail else ""}')

    # --- executive_summary number checks ---
    total = expect.get('exec_total_munis')
    if total is not None:
        if str(total) in exec_s:
            ok(f'total_municipalities ({total}) in exec')
        else:
            fail(f'total_municipalities ({total}) missing from exec', f'got: {exec_s!r}')

    confirmed_munis = expect.get('exec_confirmed_munis')
    if confirmed_munis is not None:
        if str(confirmed_munis) in exec_s:
            ok(f'confirmed_municipalities ({confirmed_munis}) in exec')
        else:
            fail(f'confirmed_municipalities ({confirmed_munis}) missing from exec', f'got: {exec_s!r}')

    confirmed_provs = expect.get('exec_confirmed_provs')
    if confirmed_provs is not None:
        if str(confirmed_provs) in exec_s:
            ok(f'confirmed_provinces ({confirmed_provs}) in exec')
        else:
            fail(f'confirmed_provinces ({confirmed_provs}) missing from exec', f'got: {exec_s!r}')

    # --- executive_summary must NOT contain province/municipality names ---
    if expect.get('exec_no_location_names'):
        location_names = (
            [a['province'] for a in inp.get('top_areas', [])] +
            [m['municipality'] for m in inp.get('top_municipalities', [])]
        )
        # Only check Part 1 (before the period ending "large flooding.")
        part1_match = re.match(r'^(.*?large flooding\.)', exec_s, re.DOTALL)
        part1 = part1_match.group(1) if part1_match else exec_s
        leaked = [name for name in location_names if name in part1]
        if leaked:
            fail('exec Part 1 contains location names', str(leaked))
        else:
            ok('exec Part 1 has no location names')

    # --- singular/plural agreement ---
    if expect.get('plural_municipality_in_exec'):
        if re.search(r'\b\d+ municipalities\b', exec_s):
            ok('plural municipalities in exec')
        else:
            fail('plural municipalities in exec', f'got: {exec_s!r}')

    if expect.get('singular_confirmed_municipality'):
        if re.search(r'\b1 municipality\b', exec_s) and '1 municipalities' not in exec_s:
            ok('singular confirmed municipality in exec')
        else:
            fail('singular confirmed municipality in exec', f'got: {exec_s!r}')

    if expect.get('plural_province_in_exec'):
        if re.search(r'\b\d+ provinces\b', exec_s):
            ok('plural provinces in exec')
        else:
            fail('plural provinces in exec', f'got: {exec_s!r}')

    if expect.get('singular_confirmed_province'):
        if re.search(r'\b1 province\b', exec_s) and '1 provinces' not in exec_s:
            ok('singular confirmed province in exec')
        else:
            fail('singular confirmed province in exec', f'got: {exec_s!r}')

    # --- zero-confirmed special case ---
    if expect.get('exec_no_confirmed_phrase'):
        if 'no municipalities' in exec_s.lower() or 'no confirmed' in exec_s.lower() or 'no municipalities had' in exec_s.lower():
            ok('zero-confirmed phrasing in exec')
        else:
            fail('zero-confirmed phrasing missing from exec', f'got: {exec_s!r}')

    # --- area_summary singular/plural province phrasing ---
    if expect.get('area_province_singular'):
        if re.search(r'The following province had', area_s, re.IGNORECASE):
            ok('province singular in area_summary')
        else:
            fail('province singular in area_summary', f'got: {area_s!r}')

    if expect.get('area_province_plural'):
        if re.search(r'The following provinces had', area_s, re.IGNORECASE):
            ok('provinces plural in area_summary')
        else:
            fail('provinces plural in area_summary', f'got: {area_s!r}')

    # --- area_summary content ---
    for province in expect.get('province_in_area', []):
        if province in area_s:
            ok(f'province "{province}" in area_summary')
        else:
            fail(f'province "{province}" missing from area_summary')

    for muni in expect.get('muni_in_area', []):
        if muni in area_s:
            ok(f'municipality "{muni}" in area_summary')
        else:
            fail(f'municipality "{muni}" missing from area_summary')

    for province in expect.get('bold_province', []):
        if f'<strong>{province}</strong>' in area_s:
            ok(f'province "{province}" is bold')
        else:
            fail(f'province "{province}" not bold in area_summary')

    for muni in expect.get('bold_muni', []):
        if f'<strong>{muni}</strong>' in area_s:
            ok(f'municipality "{muni}" is bold')
        else:
            fail(f'municipality "{muni}" not bold in area_summary')

    if expect.get('area_summary_empty'):
        if not area_s.strip():
            ok('area_summary empty for zero-confirmed case')
        else:
            fail('area_summary should be empty for zero-confirmed', f'got: {area_s!r}')

    # --- forbidden terms ---
    if expect.get('no_forbidden_terms'):
        found = [t for t in _HISTORICAL_FORBIDDEN_TERMS if t in full]
        if not found:
            ok('no forbidden terms')
        else:
            fail('forbidden terms found', str(found))

    # --- caveat ---
    if expect.get('caveat_non_empty'):
        if caveat.strip():
            ok('caveat non-empty')
        else:
            fail('caveat is empty')

    if expect.get('caveat_contains_counts'):
        total_munis = inp.get('total_municipalities', 0)
        confirmed = inp.get('confirmed_municipalities', 0)
        if str(total_munis) in caveat and str(confirmed) in caveat:
            ok('caveat contains both municipality counts')
        else:
            fail('caveat missing municipality counts', f'got: {caveat!r}')

    return cr


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = 'Evaluate past event LLM pipeline output rules and faithfulness.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose', action='store_true',
            help='Print full output text for each fixture.',
        )

    def handle(self, *args, **options):
        verbose = options['verbose']

        total_checks = 0
        total_passed = 0
        case_results = []

        self.stdout.write('\n' + '=' * 65)
        self.stdout.write('  IBFF Past Event Pipeline — Accuracy Evaluation')
        self.stdout.write('=' * 65)

        for fixture in FIXTURES:
            label = fixture['label']
            inp = fixture['input']

            result = build_historical_fallback(inp)

            cr = _check(result, inp, fixture['expect'])
            passed = len(cr.passed)
            failed = len(cr.failed)
            total = passed + failed
            total_checks += total
            total_passed += passed
            case_results.append((label, passed, total, cr))

            status = self.style.SUCCESS('PASS') if failed == 0 else self.style.ERROR('FAIL')
            self.stdout.write(f'\n[{status}] {label}')
            self.stdout.write(f'       Rule checks: {passed}/{total} passed')

            if failed > 0:
                for f in cr.failed:
                    self.stdout.write(self.style.ERROR(f'  ✗ {f}'))
            if verbose:
                if cr.passed:
                    for p in cr.passed:
                        self.stdout.write(self.style.SUCCESS(f'  ✓ {p}'))
                self.stdout.write(f'\n  executive_summary : {result.get("executive_summary", "")}')
                self.stdout.write(f'  area_summary      : {result.get("area_summary", "")}')
                self.stdout.write(f'  caveat            : {result.get("caveat", "")}')

        rule_pct = round(100 * total_passed / total_checks) if total_checks else 0
        cases_passed = sum(1 for _, p, t, _ in case_results if p == t)

        self.stdout.write('\n' + '=' * 65)
        self.stdout.write('  RESULTS')
        self.stdout.write('-' * 65)
        self.stdout.write(f'  Cases fully passing: {cases_passed}/{len(FIXTURES)}')
        self.stdout.write(f'  Checks passed      : {total_passed}/{total_checks}  ({rule_pct}%)')
        self.stdout.write('=' * 65 + '\n')
