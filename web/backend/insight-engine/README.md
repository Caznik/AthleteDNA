# AthleteDNA Insight Engine

A stateless **Python (FastAPI)** service that turns a user's activity history into
statistical training metrics — the Performance Management Chart (CTL/ATL/TSB), weekly
load, simple trends, and per-type PRs.

It holds no state and never touches the database. The Spring backend authenticates the
end user, loads their activities, and calls this engine over an internal HTTP API,
presenting a shared-secret header (`X-Internal-Token`). The browser never calls it
directly. See `workitem/WI-insight-engine/` for the design.

## Layout

```
app/
  main.py            FastAPI app: GET /health, POST /insights/training
  security.py        X-Internal-Token verification (fail closed)
  config.py          settings (INTERNAL_TOKEN from env)
  models.py          request/response wire contract (camelCase JSON)
  metrics/           pure, dependency-free computation:
    load.py            v1 stress score (swappable) + null-HR fallback
    pmc.py             CTL(42)/ATL(7)/TSB recursive EWMA + form label
    weekly.py          ISO-week load buckets
    trends.py          CTL ramp/week + TSB direction
    prs.py             per-type max distance/duration + best pace
    insights.py        orchestrator -> InsightsResult
tests/               pytest (incl. the hand-computed PMC vector)
```

The `metrics/` package has **no external dependencies**, so its logic is unit-testable
with a bare Python interpreter; FastAPI/pydantic only wrap it at the edge.

## API

`POST /insights/training` (header `X-Internal-Token: <secret>`)

Request:
```json
{ "activities": [
  { "startDate": "2026-06-01T07:00:00Z", "type": "Run",
    "distance": 10000.0, "duration": 3600, "avgHr": 150 }
] }
```
`startDate` ISO-8601 (UTC); `distance` meters; `duration` seconds; `avgHr` int or null.

Response: `{ pmc: { series[], current }, weeklyLoad[], trends, prs[] }` — see `models.py`.

Missing/wrong token → `401`. Empty `activities` → `200` with zeroed/empty results.

## Run locally

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
INTERNAL_TOKEN=dev-secret uvicorn app.main:app --reload --port 8000
```

## Test

```bash
pip install -r requirements-dev.txt
pytest
```

## Config

| Env | Purpose |
|---|---|
| `INTERNAL_TOKEN` | Shared secret the caller (Spring) must send as `X-Internal-Token`. Empty ⇒ every request is rejected. |
