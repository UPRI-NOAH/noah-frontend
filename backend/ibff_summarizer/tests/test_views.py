import json
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

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
    'exposed_facilities': {'schools': 88, 'health_facilities': 12, 'warehouses': 4},
    'highest_hazard_level': 'High',
    'notes': ['Counts exclude barangays tagged Little to None.'],
}

VALID_SUMMARY = {
    'executive_summary': 'Summary text.',
    'key_insights': ['Insight 1.', 'Insight 2.', 'Insight 3.'],
    'caveat': 'Indicative only.',
    '_source': 'llm',
}


class ForecastSummaryViewTest(TestCase):
    url = '/api/forecast-summary/'

    @patch('ibff_summarizer.views.generate_forecast_summary', return_value=VALID_SUMMARY)
    def test_post_valid_payload_returns_200(self, _mock):
        response = self.client.post(
            self.url,
            data=json.dumps(SAMPLE_INPUT),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('executive_summary', data)
        self.assertIn('key_insights', data)
        self.assertIn('caveat', data)

    def test_post_invalid_payload_returns_400(self):
        bad_payload = {'forecast_timestamp': '2026-05-07'}
        response = self.client.post(
            self.url,
            data=json.dumps(bad_payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.json())

    def test_get_not_allowed(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)

    @patch(
        'ibff_summarizer.views.generate_forecast_summary',
        return_value={
            'executive_summary': 'Fallback summary.',
            'key_insights': ['154 barangays affected.'],
            'caveat': 'Indicative only.',
            '_source': 'fallback',
        },
    )
    def test_fallback_source_is_returned(self, _mock):
        response = self.client.post(
            self.url,
            data=json.dumps(SAMPLE_INPUT),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['_source'], 'fallback')
