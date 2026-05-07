"""
IBFF LLM Summarization Pipeline

Converts verified forecast JSON into a concise executive summary using a
local Ollama model. The LLM only narrates—it does not compute forecasts,
exposure counts, risk levels, or recommendations.
"""

import json
import logging
import re
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

FORBIDDEN_TERMS = frozenset([
    'catastrophic',
    'devastating',
    'life-threatening',
    'crisis',
    'emergency',
    'evacuate immediately',
    'storm surge',
    'landslide',
    'casualties',
    'deaths',
    'destroyed',
])

# Title-case words that legitimately appear in well-formed English sentences
# but are not geographic place names. Used to prevent false positives in the
# location check.
_COMMON_NON_LOCATION_WORDS = frozenset([
    'The', 'This', 'These', 'Those', 'There', 'Their',
    'As', 'Of', 'In', 'On', 'At', 'And', 'Or', 'But',
    'For', 'With', 'Not', 'No', 'By', 'Per', 'Its',
    'Note', 'Based', 'Counts', 'Exposed', 'Exposure',
    'Indicative', 'Available', 'Total', 'Follows', 'Top',
    'Insight', 'Key', 'Run', 'Area', 'Areas', 'Level',
    # Hazard terms — validated separately
    'Low', 'Medium', 'High', 'Very', 'Extreme',
])

PROMPT_TEMPLATE = """You are a concise government report writer for the NOAH flood forecasting system.

Your ONLY task is to convert the structured JSON data below into a short executive summary.

STRICT RULES:
- Use ONLY the numbers, location names, and hazard levels present in the JSON.
- Do NOT invent locations, counts, percentages, causes, or weather explanations.
- Do NOT add evacuation advice or recommendations.
- Do NOT use dramatic terms such as: catastrophic, devastating, life-threatening, crisis, emergency, evacuate immediately, storm surge, landslide, casualties, deaths, destroyed.
- Use "affected" instead of "flooded" unless the input explicitly says "flooded".
- If a value is missing, write "not available" rather than guessing.
- Keep language concise and appropriate for LGU or government decision-makers.

Return ONLY a valid JSON object with this exact structure:
{{
  "executive_summary": "<one-paragraph summary>",
  "key_insights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>"
  ],
  "caveat": "<one-sentence caveat drawn from the notes field>"
}}

INPUT DATA:
{summary_json}

OUTPUT (valid JSON only, no extra text):"""


def build_llm_prompt(summary_json: dict) -> str:
    """Return a constrained prompt string for the local LLM."""
    # Skip LLM for zero-data case — fallback handles it clearly
    if summary_json.get('affected_barangays') == 0:
        return ''
    return PROMPT_TEMPLATE.format(
        summary_json=json.dumps(summary_json, indent=2)
    )


def call_ollama(
    prompt: str,
    model_name: str | None = None,
    endpoint: str | None = None,
    timeout: int | None = None,
) -> str:
    """
    Send prompt to Ollama and return the raw generated text.

    Raises:
        requests.Timeout: when Ollama does not respond within `timeout` seconds.
        requests.RequestException: for any other network error.
        ValueError: when the Ollama response body is malformed.
    """
    model_name = model_name or settings.OLLAMA_MODEL
    endpoint = endpoint or settings.OLLAMA_ENDPOINT
    timeout = timeout if timeout is not None else settings.OLLAMA_TIMEOUT

    payload = {
        'model': model_name,
        'prompt': prompt,
        'stream': False,
        'options': {
            'temperature': 0.1,
            'top_p': 0.9,
            'num_predict': 512,
        },
    }

    response = requests.post(endpoint, json=payload, timeout=timeout)
    response.raise_for_status()

    data = response.json()
    generated = data.get('response', '').strip()
    if not generated:
        raise ValueError('Ollama returned an empty response field')
    return generated


def _extract_all_numbers(text: str) -> set[str]:
    """Return all numeric tokens found in a string."""
    return set(re.findall(r'\b\d+(?:\.\d+)?\b', text))


def _extract_allowed_numbers(summary_json: dict) -> set[str]:
    """Collect every numeric value that appears in the input JSON."""
    raw = json.dumps(summary_json)
    return _extract_all_numbers(raw)


def _extract_allowed_locations(summary_json: dict) -> set[str]:
    """Collect every location/place name that appears in the input JSON."""
    locations: set[str] = set()
    for area in summary_json.get('top_areas', []):
        if 'province' in area:
            locations.add(area['province'].lower())
    return locations


def _extract_allowed_hazard_levels(summary_json: dict) -> set[str]:
    """Collect every hazard level string from the input JSON."""
    levels: set[str] = set()
    hl = summary_json.get('highest_hazard_level', '')
    if hl:
        levels.add(hl.lower())
    return levels


def validate_llm_output(llm_output: str, summary_json: dict) -> tuple[bool, str]:
    """
    Validate that the LLM output:
      - is valid JSON with the required keys
      - contains no numbers absent from the input
      - contains no location names absent from the input
      - contains no hazard levels absent from the input
      - contains no forbidden terms

    Returns:
        (True, parsed_json_string)  on success
        (False, reason_string)      on failure
    """
    # 1. Must parse as JSON
    try:
        parsed = json.loads(llm_output)
    except json.JSONDecodeError as exc:
        return False, f'Invalid JSON: {exc}'

    # 2. Required keys
    required_keys = {'executive_summary', 'key_insights', 'caveat'}
    missing = required_keys - parsed.keys()
    if missing:
        return False, f'Missing required keys: {missing}'

    full_text = (
        parsed.get('executive_summary', '') + ' '
        + ' '.join(parsed.get('key_insights', [])) + ' '
        + parsed.get('caveat', '')
    ).lower()

    # 3. No forbidden terms
    for term in FORBIDDEN_TERMS:
        if term in full_text:
            return False, f'Forbidden term found: "{term}"'

    # 4. Every number in output must appear in the input
    allowed_numbers = _extract_allowed_numbers(summary_json)
    output_numbers = _extract_all_numbers(full_text)
    invented_numbers = output_numbers - allowed_numbers
    if invented_numbers:
        return False, f'Invented numbers detected: {invented_numbers}'

    # 5. Every hazard level in output must appear in the input
    # (checked before location so hazard adjectives are not caught as place names)
    allowed_hazard_levels = _extract_allowed_hazard_levels(summary_json)
    hazard_level_pattern = re.compile(
        r'\b(very high|low|medium|high|extreme)\b', re.IGNORECASE
    )
    output_hazard_levels = {
        m.group(0).lower() for m in hazard_level_pattern.finditer(full_text)
    }
    invented_hazard_levels = output_hazard_levels - allowed_hazard_levels
    if invented_hazard_levels:
        return False, f'Hazard levels not in input: {invented_hazard_levels}'

    # 6. Every location in output must appear in the input
    allowed_locations = _extract_allowed_locations(summary_json)
    if allowed_locations:
        # Scan output for title-case tokens that could be place names.
        # Exclude known English non-location words to avoid false positives
        # for sentence starters and common adjectives.
        output_words = set(re.findall(r'\b[A-Z][a-z]{2,}\b', llm_output))
        input_text = json.dumps(summary_json)
        input_words = set(re.findall(r'\b[A-Z][a-z]{2,}\b', input_text))
        candidates = output_words - input_words - _COMMON_NON_LOCATION_WORDS
        if candidates:
            return False, f'Invented place names detected: {candidates}'

    return True, json.dumps(parsed)


def build_fallback_summary(summary_json: dict) -> dict:
    """
    Return a deterministic fallback summary built directly from the input JSON
    without any LLM involvement.
    """
    ts = summary_json.get('forecast_timestamp', 'not available')
    run = summary_json.get('model_run', 'not available')
    brgy = summary_json.get('affected_barangays', 'not available')
    muni = summary_json.get('affected_municipalities', 'not available')
    prov = summary_json.get('affected_provinces', 'not available')
    hazard = summary_json.get('highest_hazard_level', 'not available')

    # No active forecast — return a clear no-data summary
    if brgy == 0:
        notes = summary_json.get('notes', [])
        caveat = notes[0] if notes else (
            'Boundaries used are indicative.'
        )
        return {
            'executive_summary': (
                f'As of the {ts} forecast (model run {run}), '
                'no barangays currently meet the pre-determined thresholds '
                'for large flood exposure. No affected areas are displayed.'
            ),
            'key_insights': [
                'No barangays meet the current flood exposure threshold.',
                'This may indicate no significant rainfall forecast for the next 24 hours.',
            ],
            'caveat': caveat,
        }

    top_areas = summary_json.get('top_areas', [])
    top_area_text = 'not available'
    if top_areas:
        parts = [
            f"{a.get('province', 'Unknown')} ({a.get('affected_barangays', '?')} barangays)"
            for a in top_areas[:3]
        ]
        top_area_text = ', '.join(parts)

    facilities = summary_json.get('exposed_facilities', {})
    schools = facilities.get('schools', 'not available')
    health = facilities.get('health_facilities', 'not available')
    warehouses = facilities.get('warehouses', 'not available')

    notes = summary_json.get('notes', [])
    caveat = notes[0] if notes else (
        'This summary is derived directly from model output. '
        'Boundaries used are indicative.'
    )

    key_insights: list[str] = []
    if brgy != 'not available':
        key_insights.append(
            f'{brgy} barangays across {muni} municipalities and {prov} provinces are affected.'
        )
    if top_areas:
        key_insights.append(f'Top affected areas: {top_area_text}.')
    if facilities:
        key_insights.append(
            f'Exposed critical facilities: {schools} schools, '
            f'{health} health facilities, {warehouses} warehouses.'
        )
    if not key_insights:
        key_insights = ['Exposure data not available for this forecast run.']

    return {
        'executive_summary': (
            f'As of the {ts} forecast (model run {run}), '
            f'{brgy} barangays across {muni} municipalities in {prov} provinces '
            f'are within the affected area. '
            f'The highest recorded hazard level is {hazard}.'
        ),
        'key_insights': key_insights,
        'caveat': caveat,
        '_source': 'fallback',
    }


def generate_forecast_summary(
    summary_json: dict,
    model_name: str | None = None,
    endpoint: str | None = None,
) -> dict:
    """
    Main entry point.

    Attempts LLM summarization; falls back to deterministic output on any
    failure (Ollama unavailable, timeout, validation failure, bad JSON).

    Returns a dict with keys: executive_summary, key_insights, caveat,
    and optionally _source ('llm' | 'fallback').
    """
    prompt = build_llm_prompt(summary_json)

    # Short-circuit for no-data case — LLM adds no value here
    if not prompt:
        result = build_fallback_summary(summary_json)
        result['_source'] = 'fallback'
        return result

    try:
        raw_output = call_ollama(prompt, model_name=model_name, endpoint=endpoint)
    except requests.Timeout:
        logger.warning('Ollama request timed out — using fallback summary')
        result = build_fallback_summary(summary_json)
        result['_source'] = 'fallback'
        return result
    except requests.RequestException as exc:
        logger.warning('Ollama request failed (%s) — using fallback summary', exc)
        result = build_fallback_summary(summary_json)
        result['_source'] = 'fallback'
        return result

    # Strip markdown fences that some models emit
    cleaned = re.sub(r'^```(?:json)?\s*', '', raw_output, flags=re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned, flags=re.MULTILINE).strip()

    valid, payload = validate_llm_output(cleaned, summary_json)
    if not valid:
        logger.warning('LLM output failed validation (%s) — using fallback', payload)
        result = build_fallback_summary(summary_json)
        result['_source'] = 'fallback'
        return result

    parsed = json.loads(payload)
    parsed['_source'] = 'llm'
    return parsed
