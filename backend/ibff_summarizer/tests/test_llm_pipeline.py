"""
Unit tests for the IBFF LLM summarization pipeline.

Covers:
  - valid LLM output accepted
  - invented number rejected
  - invented location rejected
  - forbidden term rejected
  - invalid JSON rejected
  - Ollama timeout → fallback
  - Ollama connection error → fallback
  - fallback summary generation
  - end-to-end generate_forecast_summary happy path
  - end-to-end generate_forecast_summary fallback path
"""

import json
from unittest.mock import MagicMock, patch

import requests
from django.test import TestCase

from ibff_summarizer.llm_pipeline import (
    FORBIDDEN_TERMS,
    build_fallback_summary,
    build_llm_prompt,
    call_ollama,
    generate_forecast_summary,
    validate_llm_output,
)

SAMPLE_INPUT = {
    'forecast_timestamp': '2026-05-07 08:00 PHT',
    'model_run': '06Z',
    'affected_barangays': 154,
    'affected_municipalities': 23,
    'affected_provinces': 5,
    'top_areas': [
        {'province': 'Cagayan', 'affected_barangays': 48},
        {'province': 'Isabela', 'affected_barangays': 39},
    ],
    'exposed_facilities': {
        'schools': 88,
        'health_facilities': 12,
        'warehouses': 4,
    },
    'highest_hazard_level': 'High',
    'notes': [
        'Counts exclude barangays tagged Little to None.',
        'Exposure is based on intersection with NOAH flood hazard layers.',
    ],
}

VALID_LLM_OUTPUT = json.dumps({
    'executive_summary': (
        'As of the 2026-05-07 08:00 PHT forecast (model run 06Z), '
        '154 barangays across 23 municipalities and 5 provinces are within '
        'the affected area. The highest hazard level recorded is High.'
    ),
    'key_insights': [
        'Cagayan has the highest number of affected barangays at 48.',
        'Isabela follows with 39 affected barangays.',
        '88 schools, 12 health facilities, and 4 warehouses are exposed.',
    ],
    'caveat': 'Counts exclude barangays tagged Little to None.',
})


class TestBuildLlmPrompt(TestCase):
    def test_contains_input_json(self):
        prompt = build_llm_prompt(SAMPLE_INPUT)
        self.assertIn('154', prompt)
        self.assertIn('Cagayan', prompt)
        self.assertIn('High', prompt)

    def test_contains_strict_rules(self):
        prompt = build_llm_prompt(SAMPLE_INPUT)
        self.assertIn('Do NOT invent', prompt)
        self.assertIn('catastrophic', prompt)

    def test_output_format_instruction_present(self):
        prompt = build_llm_prompt(SAMPLE_INPUT)
        self.assertIn('executive_summary', prompt)
        self.assertIn('key_insights', prompt)
        self.assertIn('caveat', prompt)


class TestCallOllama(TestCase):
    @patch('ibff_summarizer.llm_pipeline.requests.post')
    def test_returns_response_text(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {'response': VALID_LLM_OUTPUT}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = call_ollama('test prompt', model_name='llama3', endpoint='http://localhost:11434/api/generate')
        self.assertEqual(result, VALID_LLM_OUTPUT)

    @patch('ibff_summarizer.llm_pipeline.requests.post')
    def test_raises_timeout(self, mock_post):
        mock_post.side_effect = requests.Timeout()
        with self.assertRaises(requests.Timeout):
            call_ollama('test prompt', model_name='llama3', endpoint='http://localhost:11434/api/generate')

    @patch('ibff_summarizer.llm_pipeline.requests.post')
    def test_raises_connection_error(self, mock_post):
        mock_post.side_effect = requests.ConnectionError()
        with self.assertRaises(requests.RequestException):
            call_ollama('test prompt', model_name='llama3', endpoint='http://localhost:11434/api/generate')

    @patch('ibff_summarizer.llm_pipeline.requests.post')
    def test_raises_value_error_on_empty_response(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {'response': ''}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        with self.assertRaises(ValueError):
            call_ollama('test prompt', model_name='llama3', endpoint='http://localhost:11434/api/generate')


class TestValidateLlmOutput(TestCase):
    def test_valid_output_passes(self):
        ok, _ = validate_llm_output(VALID_LLM_OUTPUT, SAMPLE_INPUT)
        self.assertTrue(ok)

    def test_invalid_json_fails(self):
        ok, reason = validate_llm_output('not json at all', SAMPLE_INPUT)
        self.assertFalse(ok)
        self.assertIn('Invalid JSON', reason)

    def test_missing_key_fails(self):
        bad = json.dumps({'executive_summary': 'ok', 'key_insights': []})
        ok, reason = validate_llm_output(bad, SAMPLE_INPUT)
        self.assertFalse(ok)
        self.assertIn('Missing required keys', reason)

    def test_invented_number_fails(self):
        data = {
            'executive_summary': '9999 barangays are affected.',
            'key_insights': ['Insight one.'],
            'caveat': 'Indicative only.',
        }
        ok, reason = validate_llm_output(json.dumps(data), SAMPLE_INPUT)
        self.assertFalse(ok)
        self.assertIn('Invented numbers', reason)

    def test_invented_location_fails(self):
        data = {
            'executive_summary': (
                '154 barangays in Pangasinan province are affected.'
            ),
            'key_insights': ['Insight one.'],
            'caveat': 'Indicative only.',
        }
        ok, reason = validate_llm_output(json.dumps(data), SAMPLE_INPUT)
        self.assertFalse(ok)
        self.assertIn('Invented place names', reason)

    def test_forbidden_term_catastrophic_fails(self):
        data = {
            'executive_summary': 'This is a catastrophic event.',
            'key_insights': ['154 barangays affected.'],
            'caveat': 'Indicative only.',
        }
        ok, reason = validate_llm_output(json.dumps(data), SAMPLE_INPUT)
        self.assertFalse(ok)
        self.assertIn('Forbidden term', reason)

    def test_forbidden_term_emergency_fails(self):
        data = {
            'executive_summary': '154 barangays face a crisis and emergency.',
            'key_insights': ['23 municipalities affected.'],
            'caveat': 'Indicative only.',
        }
        ok, reason = validate_llm_output(json.dumps(data), SAMPLE_INPUT)
        self.assertFalse(ok)
        self.assertIn('Forbidden term', reason)

    def test_all_forbidden_terms_covered(self):
        """Every forbidden term must trigger a validation failure."""
        for term in FORBIDDEN_TERMS:
            data = {
                'executive_summary': f'154 barangays. Note: {term} situation.',
                'key_insights': ['23 municipalities.'],
                'caveat': 'Indicative.',
            }
            ok, reason = validate_llm_output(json.dumps(data), SAMPLE_INPUT)
            self.assertFalse(ok, f'Expected failure for forbidden term: {term}')

    def test_hazard_level_not_in_input_fails(self):
        data = {
            'executive_summary': '154 barangays face Very High hazard.',
            'key_insights': ['23 municipalities affected.'],
            'caveat': 'Indicative only.',
        }
        # SAMPLE_INPUT has 'High' but not 'Very High'
        ok, reason = validate_llm_output(json.dumps(data), SAMPLE_INPUT)
        self.assertFalse(ok)
        self.assertIn('Hazard levels not in input', reason)

    def test_markdown_fences_stripped_in_pipeline(self):
        """generate_forecast_summary strips ```json fences before validation."""
        fenced = '```json\n' + VALID_LLM_OUTPUT + '\n```'
        with patch('ibff_summarizer.llm_pipeline.call_ollama', return_value=fenced):
            result = generate_forecast_summary(SAMPLE_INPUT)
        self.assertEqual(result['_source'], 'llm')


class TestBuildFallbackSummary(TestCase):
    def test_contains_all_key_counts(self):
        result = build_fallback_summary(SAMPLE_INPUT)
        self.assertIn('154', result['executive_summary'])
        self.assertIn('23', result['executive_summary'])
        self.assertIn('5', result['executive_summary'])

    def test_hazard_level_present(self):
        result = build_fallback_summary(SAMPLE_INPUT)
        self.assertIn('High', result['executive_summary'])

    def test_key_insights_non_empty(self):
        result = build_fallback_summary(SAMPLE_INPUT)
        self.assertIsInstance(result['key_insights'], list)
        self.assertGreater(len(result['key_insights']), 0)

    def test_caveat_from_notes(self):
        result = build_fallback_summary(SAMPLE_INPUT)
        self.assertIn('Little to None', result['caveat'])

    def test_missing_fields_use_not_available(self):
        minimal = {'forecast_timestamp': '2026-05-07', 'model_run': '06Z'}
        result = build_fallback_summary(minimal)
        self.assertIn('not available', result['executive_summary'])

    def test_top_areas_in_key_insights(self):
        result = build_fallback_summary(SAMPLE_INPUT)
        combined = ' '.join(result['key_insights'])
        self.assertIn('Cagayan', combined)
        self.assertIn('Isabela', combined)


class TestGenerateForecastSummary(TestCase):
    @patch('ibff_summarizer.llm_pipeline.call_ollama', return_value=VALID_LLM_OUTPUT)
    def test_llm_happy_path(self, _mock):
        result = generate_forecast_summary(SAMPLE_INPUT)
        self.assertEqual(result['_source'], 'llm')
        self.assertIn('executive_summary', result)
        self.assertIn('key_insights', result)
        self.assertIn('caveat', result)

    @patch('ibff_summarizer.llm_pipeline.call_ollama', side_effect=requests.Timeout())
    def test_timeout_returns_fallback(self, _mock):
        result = generate_forecast_summary(SAMPLE_INPUT)
        self.assertEqual(result['_source'], 'fallback')

    @patch('ibff_summarizer.llm_pipeline.call_ollama', side_effect=requests.ConnectionError())
    def test_connection_error_returns_fallback(self, _mock):
        result = generate_forecast_summary(SAMPLE_INPUT)
        self.assertEqual(result['_source'], 'fallback')

    @patch('ibff_summarizer.llm_pipeline.call_ollama', return_value='not valid json')
    def test_invalid_json_from_llm_returns_fallback(self, _mock):
        result = generate_forecast_summary(SAMPLE_INPUT)
        self.assertEqual(result['_source'], 'fallback')

    @patch(
        'ibff_summarizer.llm_pipeline.call_ollama',
        return_value=json.dumps({
            'executive_summary': '9999 barangays affected.',
            'key_insights': ['Something.'],
            'caveat': 'Indicative.',
        }),
    )
    def test_invented_number_returns_fallback(self, _mock):
        result = generate_forecast_summary(SAMPLE_INPUT)
        self.assertEqual(result['_source'], 'fallback')
