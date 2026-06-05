"""
Past Event IBFF Summarization Pipeline

Syncs historical typhoon event data from Google Sheets, filters municipalities
with confirmed social media flood reports, and generates LLM summaries using
past-tense, municipality-level framing.
"""

import json
import logging
import re
from datetime import date, datetime, timezone
from typing import Optional

import gspread
from django.conf import settings
from google.oauth2.service_account import Credentials

from ibff_summarizer.llm_pipeline import (
    FORBIDDEN_TERMS,
    _COMMON_NON_LOCATION_WORDS,
    _extract_all_numbers,
    build_fallback_summary,
    call_ollama,
)

logger = logging.getLogger(__name__)

_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

# Matches: "February 5, 2026 (BASYANGPH)" — case insensitive
# Group 1: date string, Group 2: event name without trailing PH
_TAB_PATTERN = re.compile(
    r'^(\w+\s+\d{1,2},?\s*\d{4})\s*\(([^)]+?)ph\)\s*$',
    re.IGNORECASE,
)

_MONTH_MAP = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
}

# Additional forbidden terms for historical context
# 'might experience' is intentionally allowed — the forecast narrative correctly uses it
# ("the IBFF forecasted that X municipalities might experience large flooding")
_HISTORICAL_FORBIDDEN_TERMS = FORBIDDEN_TERMS | frozenset([
    'might flood',
    'may flood',
])

HISTORICAL_PROMPT_TEMPLATE = """You are a concise government report writer for the NOAH flood forecasting and monitoring system.

Your ONLY task is to convert the structured JSON data below into three short paragraphs that tell the complete story: what the IBFF system FORECAST before the typhoon, and what social media and news reports CONFIRMED afterward.

STRICT RULES:
- Use ONLY the numbers and location names present in the JSON.
- Do NOT invent locations, counts, or percentages.
- Do NOT add evacuation advice or recommendations.
- Do NOT use dramatic terms such as: catastrophic, devastating, life-threatening, crisis, emergency, evacuate immediately, storm surge, landslide, casualties, deaths, destroyed.
- Use past tense throughout. The executive_summary MUST follow this two-part structure:
    Part 1 — forecast: "For [event_name] on [event_date], the IBFF system forecasted that [total_municipalities] [municipality/municipalities] might experience large flooding."
    Part 2 — confirmation: "Of these, [confirmed_municipalities] [municipality/municipalities] across [confirmed_provinces] [province/provinces] were confirmed to have experienced flooding based on social media and news reports."
- In area_summary: if top_areas has 1 entry, write "The following province had"; if more, write "The following provinces had".
- Name every province from top_areas individually — never reduce to a plain count.
- Do NOT perform arithmetic or sum any numbers. Copy numbers exactly as they appear in the JSON.

Return ONLY a valid JSON object with exactly these three keys:
{{
  "executive_summary": "For [event_name] on [event_date], the IBFF system forecasted that [total_municipalities] [municipality/municipalities] might experience large flooding. Of these, [confirmed_municipalities] [municipality/municipalities] across [confirmed_provinces] [province/provinces] were confirmed to have experienced flooding based on social media and news reports.",
  "area_summary": "The following province had / The following provinces had municipalities with confirmed flooding: [top_areas[0].province] ([top_areas[0].confirmed_municipalities] [municipality/municipalities]), ... Municipalities with confirmed reports include: [top_municipalities list].",
  "caveat": "This summary reflects the IBFF flood impact forecast validated by social media and news monitoring. [confirmed_municipalities] out of [total_municipalities] forecast municipalities had confirmed flooding reports. This does not represent the complete picture of ground impacts."
}}

INPUT DATA:
{summary_json}

OUTPUT (valid JSON only, no extra text):"""


def _get_sheets_client() -> gspread.Client:
    creds = Credentials.from_service_account_file(
        str(settings.GOOGLE_SERVICE_ACCOUNT_FILE),
        scopes=_SCOPES,
    )
    return gspread.authorize(creds)


def _parse_tab_title(title: str) -> Optional[tuple[str, date]]:
    """
    Parse typhoon event tab titles like "February 5, 2026 (BASYANGPH)".
    Returns (event_name, event_date) or None if the tab is not a typhoon event.
    """
    m = _TAB_PATTERN.match(title.strip())
    if not m:
        return None

    date_str = m.group(1).strip()
    event_name = m.group(2).strip().upper()

    try:
        parts = date_str.replace(',', '').split()
        month_num = _MONTH_MAP.get(parts[0].lower())
        day = int(parts[1])
        year = int(parts[2])
        if not month_num:
            return None
        event_date = date(year, month_num, day)
    except (IndexError, ValueError):
        return None

    return event_name, event_date


def _is_confirmed(row: dict) -> bool:
    val = str(row.get('Flooding Report', '')).strip().lower()
    return val in ('yes', 'true', '1', '✓', 'y')


def _to_title_case(s: str) -> str:
    return (
        s.replace('(Not a Province)', '')
        .replace('(not a province)', '')
        .strip()
        .lower()
        .replace(r'\b\w', lambda m: m.group().upper())
    )


def _parse_worksheet_rows(worksheet) -> tuple[list[dict], list[int]]:
    """
    Return (data_rows_as_dicts, col_indices) from a worksheet using get_all_values.
    data_rows_as_dicts keys: province, municipality, flooding_report, reference, notes.
    """
    all_values = worksheet.get_all_values()
    if not all_values:
        return [], {}

    raw_headers = [h.strip().lower() for h in all_values[0]]

    def _col_idx(name):
        return next((i for i, h in enumerate(raw_headers) if name in h), None)

    cols = {
        'province': _col_idx('province'),
        'municipality': _col_idx('municipality'),
        'flooding': _col_idx('flooding report'),
        'reference': _col_idx('reference'),
        'notes': _col_idx('notes'),
    }

    def _cell(row, key):
        idx = cols.get(key)
        return row[idx].strip() if idx is not None and idx < len(row) else ''

    _CONFIRMED = ('yes', 'true', '1', '✓', 'y')
    rows = []
    for row in all_values[1:]:
        if not any(c.strip() for c in row):
            continue
        rows.append({
            'province': _cell(row, 'province'),
            'municipality': _cell(row, 'municipality'),
            'confirmed': _cell(row, 'flooding').lower() in _CONFIRMED,
            'reference': _cell(row, 'reference')[:500],
            'notes': _cell(row, 'notes'),
        })
    return rows


def sync_past_events() -> list[tuple]:
    """
    Sync all typhoon event tabs from Google Sheets, grouping same-typhoon tabs
    into a single PastEvent by event_name. Returns list of (PastEvent, created, changed).
    """
    from collections import defaultdict
    from ibff_summarizer.models import PastEvent, PastEventMunicipality, PastEventSummary

    client = _get_sheets_client()
    spreadsheet = client.open_by_key(settings.GOOGLE_SHEETS_SPREADSHEET_ID)
    now = datetime.now(timezone.utc)

    # Collect all matching tabs grouped by event_name
    grouped: dict[str, list[tuple]] = defaultdict(list)
    for worksheet in spreadsheet.worksheets():
        parsed = _parse_tab_title(worksheet.title)
        if not parsed:
            continue
        event_name, event_date = parsed
        rows = _parse_worksheet_rows(worksheet)
        grouped[event_name].append((worksheet.id, event_date, rows))

    results = []

    for event_name, tabs in grouped.items():
        all_dates = [d for _, d, _ in tabs]
        date_start = min(all_dates)
        date_end = max(all_dates) if len(all_dates) > 1 else None
        sheet_gids = [gid for gid, _, _ in tabs]

        # Aggregate municipalities across all tabs — deduplicate by (province, municipality).
        # A municipality is confirmed if ANY tab has it confirmed.
        muni_map: dict[tuple, dict] = {}
        for gid, tab_date, rows in tabs:
            for r in rows:
                key = (r['province'].lower(), r['municipality'].lower())
                if key not in muni_map:
                    muni_map[key] = {**r, 'tab_date': tab_date}
                elif r['confirmed']:
                    # Upgrade to confirmed if any tab has it confirmed
                    muni_map[key]['confirmed'] = True
                    muni_map[key]['reference'] = muni_map[key]['reference'] or r['reference']

        total_munis = len(muni_map)
        confirmed_count = sum(1 for m in muni_map.values() if m['confirmed'])

        event, created = PastEvent.objects.get_or_create(
            event_name=event_name,
            defaults={
                'date_start': date_start,
                'date_end': date_end,
                'sheet_gids': sheet_gids,
                'total_municipalities': total_munis,
                'confirmed_municipalities': confirmed_count,
                'last_synced_at': now,
            },
        )

        data_changed = not created and (
            event.total_municipalities != total_munis
            or event.confirmed_municipalities != confirmed_count
            or set(event.sheet_gids) != set(sheet_gids)
        )

        if data_changed:
            if event.confirmed_municipalities != confirmed_count:
                PastEventSummary.objects.filter(event=event).delete()
            event.date_start = date_start
            event.date_end = date_end
            event.sheet_gids = sheet_gids
            event.total_municipalities = total_munis
            event.confirmed_municipalities = confirmed_count

        event.last_synced_at = now
        update_fields = ['last_synced_at']
        if data_changed:
            update_fields += ['date_start', 'date_end', 'sheet_gids',
                              'total_municipalities', 'confirmed_municipalities']
        event.save(update_fields=update_fields)

        if created or data_changed:
            PastEventMunicipality.objects.filter(event=event).delete()
            bulk = [
                PastEventMunicipality(
                    event=event,
                    province=m['province'],
                    municipality=m['municipality'],
                    has_flooding_report=m['confirmed'],
                    reference_url=m['reference'],
                    notes=m['notes'],
                    tab_date=m['tab_date'],
                )
                for m in muni_map.values()
            ]
            PastEventMunicipality.objects.bulk_create(bulk)

        results.append((event, created, data_changed))

    return results


def build_historical_summary_input(event) -> dict:
    """
    Build the LLM input dict from confirmed municipalities of a PastEvent.
    """
    confirmed_rows = list(
        event.municipalities.filter(has_flooding_report=True)
        .values('province', 'municipality')
    )

    province_map: dict[str, int] = {}
    for row in confirmed_rows:
        prov = row['province'].title()
        province_map[prov] = province_map.get(prov, 0) + 1

    top_areas = [
        {'province': prov, 'confirmed_municipalities': count}
        for prov, count in sorted(province_map.items(), key=lambda x: -x[1])[:5]
    ]

    top_municipalities = [
        {'municipality': r['municipality'].title(), 'province': r['province'].title()}
        for r in confirmed_rows[:5]
    ]

    # Build human-readable date string: "November 3–4, 2025" or "February 5, 2026"
    if event.date_end and event.date_end != event.date_start:
        date_str = (
            f'{event.date_start.strftime("%B %-d")}–'
            f'{event.date_end.strftime("%-d, %Y")}'
        )
    else:
        date_str = event.date_start.strftime('%B %-d, %Y')

    return {
        'event_name': event.display_name,  # "Typhoon Basyang"
        'event_date': date_str,
        'confirmed_municipalities': event.confirmed_municipalities,
        'total_municipalities': event.total_municipalities,
        'confirmed_provinces': len(province_map),
        'top_areas': top_areas,
        'top_municipalities': top_municipalities,
    }


def build_historical_fallback(summary_json: dict) -> dict:
    event_name = summary_json.get('event_name', 'the typhoon')
    event_date = summary_json.get('event_date', 'the event period')
    confirmed_munis = summary_json.get('confirmed_municipalities', 0)
    total_munis = summary_json.get('total_municipalities', 0)
    confirmed_provs = summary_json.get('confirmed_provinces', 0)
    top_areas = summary_json.get('top_areas', [])
    top_munis = summary_json.get('top_municipalities', [])

    total_muni_label = 'municipality' if total_munis == 1 else 'municipalities'
    confirmed_muni_label = 'municipality' if confirmed_munis == 1 else 'municipalities'
    prov_label = 'province' if confirmed_provs == 1 else 'provinces'

    caveat = (
        f'This summary reflects the IBFF flood impact forecast validated by social media '
        f'and news monitoring. {confirmed_munis} out of {total_munis} forecast '
        f'{total_muni_label} had confirmed flooding reports. '
        f'This does not represent the complete picture of ground impacts.'
    )

    if confirmed_munis == 0:
        return {
            'executive_summary': (
                f'For {event_name} on {event_date}, the IBFF system forecasted that '
                f'{total_munis} {total_muni_label} might experience large flooding. '
                f'No municipalities had confirmed flooding reports from social media and news monitoring.'
            ),
            'area_summary': '',
            'caveat': caveat,
        }

    parts = []
    if top_areas:
        prov_verb = 'province had' if len(top_areas) == 1 else 'provinces had'
        parts.append(
            f'The following {prov_verb} municipalities with confirmed flooding: '
            + ', '.join(
                f"<strong>{a['province']}</strong> "
                f"({a['confirmed_municipalities']} "
                f"{'municipality' if a['confirmed_municipalities'] == 1 else 'municipalities'})"
                for a in top_areas
            ) + '.'
        )
    if top_munis:
        parts.append(
            'Municipalities with confirmed reports include: '
            + ', '.join(f"<strong>{m['municipality']}</strong>" for m in top_munis)
            + '.'
        )

    return {
        'executive_summary': (
            f'For {event_name} on {event_date}, the IBFF system forecasted that '
            f'{total_munis} {total_muni_label} might experience large flooding. '
            f'Of these, {confirmed_munis} {confirmed_muni_label} across {confirmed_provs} {prov_label} '
            f'were confirmed to have experienced flooding based on social media and news reports.'
        ),
        'area_summary': ' '.join(parts),
        'caveat': caveat,
    }


def _validate_historical_output(llm_output: str, summary_json: dict) -> tuple[bool, str]:
    try:
        parsed = json.loads(llm_output)
    except json.JSONDecodeError as exc:
        return False, f'Invalid JSON: {exc}'

    required_keys = {'executive_summary', 'area_summary', 'caveat'}
    missing = required_keys - parsed.keys()
    if missing:
        return False, f'Missing required keys: {missing}'

    full_text = (
        parsed.get('executive_summary', '') + ' '
        + parsed.get('area_summary', '') + ' '
        + parsed.get('caveat', '')
    ).lower()

    for term in _HISTORICAL_FORBIDDEN_TERMS:
        if term in full_text:
            return False, f'Forbidden term found: "{term}"'

    # Numbers in output must appear in input
    allowed_numbers = set(re.findall(r'\b\d+(?:\.\d+)?\b', json.dumps(summary_json)))
    output_numbers = set(re.findall(r'\b\d+(?:\.\d+)?\b', full_text))
    invented = output_numbers - allowed_numbers
    if invented:
        return False, f'Invented numbers: {invented}'

    # Locations in output must appear in input
    allowed_locs = set()
    for area in summary_json.get('top_areas', []):
        if 'province' in area:
            allowed_locs.add(area['province'].lower())
    for muni in summary_json.get('top_municipalities', []):
        if 'municipality' in muni:
            allowed_locs.add(muni['municipality'].lower())

    if allowed_locs:
        output_words = set(re.findall(r'\b[A-Z][a-z]{2,}\b', llm_output))
        input_words = set(re.findall(r'\b[A-Z][a-z]{2,}\b', json.dumps(summary_json)))
        candidates = output_words - input_words - _COMMON_NON_LOCATION_WORDS
        if candidates:
            return False, f'Invented place names: {candidates}'

    return True, json.dumps(parsed)


def _bold_historical_locations(text: str, summary_json: dict) -> str:
    for area in summary_json.get('top_areas', []):
        name = area.get('province', '')
        if name:
            text = text.replace(name, f'<strong>{name}</strong>')
    for muni in summary_json.get('top_municipalities', []):
        name = muni.get('municipality', '')
        if name:
            text = text.replace(name, f'<strong>{name}</strong>')
    return text


def generate_past_event_summary(event) -> dict:
    """
    Main entry point for historical event summarization.

    Attempts LLM summarization of confirmed municipality flood reports;
    falls back to deterministic output on any failure.
    Saves and returns a PastEventSummary.
    """
    from ibff_summarizer.models import PastEventSummary

    model_name = settings.OLLAMA_MODEL
    generated_at = datetime.now(timezone.utc).isoformat()

    summary_json = build_historical_summary_input(event)

    def _save_and_return(result: dict, source: str, validation_passed: bool) -> dict:
        result['_source'] = source
        result['_model'] = model_name
        result['_generated_at'] = generated_at
        PastEventSummary.objects.update_or_create(
            event=event,
            defaults={
                'summary_output': {k: v for k, v in result.items() if not k.startswith('_')},
                'source': source,
                'validation_passed': validation_passed,
            },
        )
        return result

    if event.confirmed_municipalities == 0:
        result = build_historical_fallback(summary_json)
        return _save_and_return(result, 'fallback', True)

    prompt = HISTORICAL_PROMPT_TEMPLATE.format(
        summary_json=json.dumps(summary_json, indent=2)
    )

    try:
        import requests as _requests
        raw_output = call_ollama(prompt, model_name=model_name)
    except Exception as exc:
        logger.warning('Ollama failed for past event %s: %s — using fallback', event.event_name, exc)
        result = build_historical_fallback(summary_json)
        return _save_and_return(result, 'fallback', False)

    cleaned = re.sub(r'^```(?:json)?\s*', '', raw_output, flags=re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned, flags=re.MULTILINE).strip()
    start, end = cleaned.find('{'), cleaned.rfind('}')
    if start != -1 and end > start:
        cleaned = cleaned[start:end + 1]

    valid, payload = _validate_historical_output(cleaned, summary_json)
    if not valid:
        logger.warning('Historical LLM output invalid (%s) — using fallback', payload)
        result = build_historical_fallback(summary_json)
        return _save_and_return(result, 'fallback', False)

    parsed = json.loads(payload)
    fallback = build_historical_fallback(summary_json)
    parsed['executive_summary'] = fallback['executive_summary']
    parsed['area_summary'] = fallback['area_summary']
    return _save_and_return(parsed, 'llm', True)
