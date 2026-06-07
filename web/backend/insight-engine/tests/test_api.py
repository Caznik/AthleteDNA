"""HTTP-layer tests (FastAPI + pydantic). Require the dev deps (fastapi, httpx)."""
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app

TOKEN = "test-secret"


@pytest.fixture
def client():
    app.dependency_overrides[get_settings] = lambda: Settings(internal_token=TOKEN)
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health_is_open():
    assert TestClient(app).get("/health").json() == {"status": "ok"}


def test_missing_token_rejected(client):
    resp = client.post("/insights/training", json={"activities": []})
    assert resp.status_code == 401


def test_wrong_token_rejected(client):
    resp = client.post(
        "/insights/training", json={"activities": []}, headers={"X-Internal-Token": "nope"}
    )
    assert resp.status_code == 401


def test_correct_token_accepted_empty(client):
    resp = client.post(
        "/insights/training", json={"activities": []}, headers={"X-Internal-Token": TOKEN}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["pmc"]["current"]["formLabel"] == "neutral"
    assert body["weeklyLoad"] == []


def test_full_contract_shape_and_camel_case(client):
    payload = {
        "activities": [
            {
                "startDate": "2026-06-01T07:00:00Z",
                "type": "Run",
                "distance": 10000.0,
                "duration": 3600,
                "avgHr": 150,
            }
        ]
    }
    resp = client.post(
        "/insights/training", json=payload, headers={"X-Internal-Token": TOKEN}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == {"pmc", "weeklyLoad", "trends", "prs"}
    assert set(body["pmc"]) == {"series", "current"}
    assert body["pmc"]["series"][0]["date"] == "2026-06-01"
    assert "ctlRampPerWeek" in body["trends"]
    assert "tsbDirection" in body["trends"]
    pr = body["prs"][0]
    assert pr["type"] == "Run"
    assert "bestPaceSecPerKm" in pr
    assert pr["maxDistance"] == 10000.0


def test_null_avg_hr_accepted(client):
    payload = {
        "activities": [
            {
                "startDate": "2026-06-01T07:00:00Z",
                "type": "Run",
                "distance": 10000.0,
                "duration": 3600,
                "avgHr": None,
            }
        ]
    }
    resp = client.post(
        "/insights/training", json=payload, headers={"X-Internal-Token": TOKEN}
    )
    assert resp.status_code == 200
    assert resp.json()["pmc"]["series"][0]["load"] > 0
