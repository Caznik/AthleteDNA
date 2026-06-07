"""FastAPI app: the engine's only network surface.

Stateless. Receives an activity series, returns the computed training insights. Guarded
by the internal shared-secret header.
"""
from __future__ import annotations

from fastapi import Depends, FastAPI

from .metrics.insights import compute
from .models import InsightsRequest, TrainingInsights
from .security import verify_internal_token

app = FastAPI(title="AthleteDNA Insight Engine", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/insights/training", response_model=TrainingInsights)
def training_insights(
    request: InsightsRequest,
    _: None = Depends(verify_internal_token),
) -> TrainingInsights:
    result = compute(request.activities)
    return TrainingInsights.model_validate(result)
