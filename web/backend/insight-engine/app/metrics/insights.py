"""Pure orchestration: activity history -> full training-insights result.

Consumes any iterable of objects exposing `start_date` (datetime|None), `type` (str),
`distance` (float|None, meters), `duration` (int|None, seconds), `avg_hr` (int|None).
No I/O, no framework types — the FastAPI layer adapts request/response around this.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone

from .load import score
from .pmc import PmcPoint, compute_pmc, daily_series, form_label
from .prs import PersonalRecord, personal_records
from .trends import Trends, compute_trends
from .weekly import WeeklyPoint, weekly_load


@dataclass(frozen=True)
class CurrentForm:
    ctl: float
    atl: float
    tsb: float
    form_label: str


@dataclass(frozen=True)
class Pmc:
    series: list[PmcPoint]
    current: CurrentForm


@dataclass(frozen=True)
class InsightsResult:
    pmc: Pmc
    weekly_load: list[WeeklyPoint]
    trends: Trends
    prs: list[PersonalRecord]


def _utc_date(value: datetime) -> date:
    """Calendar date of an instant in UTC. Naive datetimes are assumed to be UTC."""
    if value.tzinfo is None:
        return value.date()
    return value.astimezone(timezone.utc).date()


def compute(activities) -> InsightsResult:
    loads_by_date: dict[date, float] = {}
    for a in activities:
        # Undated activities can't be placed on the daily timeline; they are skipped for
        # the PMC/weekly series but still counted for PRs (which need no date).
        if a.start_date is None:
            continue
        day = _utc_date(a.start_date)
        loads_by_date[day] = loads_by_date.get(day, 0.0) + score(
            duration=a.duration, avg_hr=a.avg_hr, activity_type=a.type
        )

    series = daily_series(loads_by_date)
    rows = compute_pmc(series)

    if rows:
        last = rows[-1]
        current = CurrentForm(
            ctl=last.ctl, atl=last.atl, tsb=last.tsb, form_label=form_label(last.tsb)
        )
    else:
        current = CurrentForm(ctl=0.0, atl=0.0, tsb=0.0, form_label=form_label(0.0))

    return InsightsResult(
        pmc=Pmc(series=rows, current=current),
        weekly_load=weekly_load(series),
        trends=compute_trends(rows),
        prs=personal_records(activities),
    )
