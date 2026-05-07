# IBFF LLM Summarization Service

A Django backend that converts verified Impact-Based Flood Forecasting (IBFF) JSON data into a concise executive summary using a local Ollama LLM. The LLM is used **only** to narrate pre-computed results — it does not perform any forecast computation, exposure analysis, or risk assessment.

---

## Architecture

```
Frontend (Angular)
    │
    ▼  POST /api/forecast-summary/
Django backend (this service)
    │
    ├─ Validates input JSON (serializer)
    ├─ Builds constrained prompt
    ├─ Calls local Ollama API
    ├─ Validates LLM output (numbers, locations, hazard levels, forbidden terms)
    └─ Returns validated summary OR deterministic fallback
    │
    ▼  (never exposed to frontend)
Ollama (local, e.g. llama3)
```

Ollama is **never** called directly from the frontend.

---

## Setup

### 1. Install Ollama and pull a model

```bash
# macOS
brew install ollama
ollama serve &
ollama pull llama3
```

### 2. Create and activate a Python virtual environment

```bash
cd backend/
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env as needed
```

### 4. Run database migrations

```bash
python manage.py migrate
```

### 5. Start the Django development server

```bash
python manage.py runserver 8080
```

---

## Environment Variables

| Variable            | Default                               | Description                                  |
| ------------------- | ------------------------------------- | -------------------------------------------- |
| `DJANGO_SECRET_KEY` | `dev-secret-key-...`                  | Django secret key (change in production)     |
| `DEBUG`             | `True`                                | Django debug mode                            |
| `ALLOWED_HOSTS`     | `localhost,127.0.0.1`                 | Comma-separated list of allowed hosts        |
| `OLLAMA_ENDPOINT`   | `http://localhost:11434/api/generate` | Ollama API endpoint                          |
| `OLLAMA_MODEL`      | `llama3`                              | Ollama model name (e.g. `llama3`, `mistral`) |
| `OLLAMA_TIMEOUT`    | `30`                                  | Request timeout in seconds                   |

---

## API Endpoint

### `POST /api/forecast-summary/`

**Request body:**

```json
{
  "forecast_timestamp": "2026-05-07 08:00 PHT",
  "model_run": "06Z",
  "affected_barangays": 154,
  "affected_municipalities": 23,
  "affected_provinces": 5,
  "top_areas": [
    { "province": "Cagayan", "affected_barangays": 48 },
    { "province": "Isabela", "affected_barangays": 39 }
  ],
  "exposed_facilities": {
    "schools": 88,
    "health_facilities": 12,
    "warehouses": 4
  },
  "highest_hazard_level": "High",
  "notes": [
    "Counts exclude barangays tagged Little to None.",
    "Exposure is based on intersection with NOAH flood hazard layers."
  ]
}
```

**Successful response (HTTP 200):**

```json
{
  "executive_summary": "As of the 2026-05-07 08:00 PHT forecast (model run 06Z), 154 barangays across 23 municipalities and 5 provinces are within the affected area. The highest hazard level recorded is High.",
  "key_insights": [
    "Cagayan has the highest number of affected barangays at 48.",
    "Isabela follows with 39 affected barangays.",
    "88 schools, 12 health facilities, and 4 warehouses are exposed."
  ],
  "caveat": "Counts exclude barangays tagged Little to None.",
  "_source": "llm"
}
```

`_source` is `"llm"` when the Ollama output passed validation, or `"fallback"` when the deterministic template was used.

**Validation error response (HTTP 400):**

```json
{
  "errors": {
    "affected_barangays": ["This field is required."]
  }
}
```

---

## Sample `curl` request

```bash
curl -s -X POST http://localhost:8080/api/forecast-summary/ \
  -H "Content-Type: application/json" \
  -d '{
    "forecast_timestamp": "2026-05-07 08:00 PHT",
    "model_run": "06Z",
    "affected_barangays": 154,
    "affected_municipalities": 23,
    "affected_provinces": 5,
    "top_areas": [
      {"province": "Cagayan", "affected_barangays": 48},
      {"province": "Isabela", "affected_barangays": 39}
    ],
    "exposed_facilities": {"schools": 88, "health_facilities": 12, "warehouses": 4},
    "highest_hazard_level": "High",
    "notes": ["Counts exclude barangays tagged Little to None."]
  }' | python -m json.tool
```

---

## Fallback Behavior

The service always returns a usable response. The deterministic fallback is used when:

1. Ollama is not running or unreachable
2. The Ollama request times out (controlled by `OLLAMA_TIMEOUT`)
3. The LLM returns invalid JSON
4. The LLM output contains **invented numbers** not present in the input
5. The LLM output contains **invented location names** not present in the input
6. The LLM output contains **hazard levels** not present in the input
7. The LLM output contains any **forbidden term**: `catastrophic`, `devastating`, `life-threatening`, `crisis`, `emergency`, `evacuate immediately`, `storm surge`, `landslide`, `casualties`, `deaths`, `destroyed`

The fallback is built directly from the input JSON using a template — no inference, no invention.

---

## Running Tests

```bash
cd backend/
python manage.py test ibff_summarizer.tests
```

Tests cover:

- Valid LLM output accepted
- Invented number rejected → fallback
- Invented location rejected → fallback
- Forbidden term rejected → fallback
- Invalid JSON from LLM → fallback
- Ollama timeout → fallback
- Ollama connection failure → fallback
- Fallback summary generation correctness
- API view happy path
- API view validation error (400)
- API view method not allowed (GET → 405)
