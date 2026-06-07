"""Wire contract (request/response) for the engine's HTTP API.

Field names are snake_case in Python but (de)serialized as camelCase to match the
Spring/ActivityDTO shape, via a camel alias generator. Response models read straight
from the pure-metrics dataclasses (`from_attributes`).
"""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# --- Request ---------------------------------------------------------------

class ActivityIn(CamelModel):
    start_date: datetime | None = None
    type: str
    distance: float | None = None
    duration: int | None = None
    avg_hr: int | None = None


class InsightsRequest(CamelModel):
    activities: list[ActivityIn] = []


# --- Response --------------------------------------------------------------

class SeriesPoint(CamelModel):
    date: date
    load: float
    ctl: float
    atl: float
    tsb: float


class CurrentForm(CamelModel):
    ctl: float
    atl: float
    tsb: float
    form_label: str


class Pmc(CamelModel):
    series: list[SeriesPoint]
    current: CurrentForm


class WeeklyLoadPoint(CamelModel):
    week_start: date
    load: float


class TrendsOut(CamelModel):
    ctl_ramp_per_week: float
    tsb_direction: str


class PrOut(CamelModel):
    type: str
    max_distance: float
    max_duration: int
    best_pace_sec_per_km: float | None = None


class TrainingInsights(CamelModel):
    pmc: Pmc
    weekly_load: list[WeeklyLoadPoint]
    trends: TrendsOut
    prs: list[PrOut]
