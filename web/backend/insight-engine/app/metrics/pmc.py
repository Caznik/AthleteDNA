"""Performance Management Chart: CTL (fitness), ATL (fatigue), TSB (form).

Exact recursive EWMA per the TrainingPeaks convention, seeded at 0 and computed over
the full daily series so the seed washes out. Pure functions, no I/O.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

CTL_TAU = 42  # fitness time constant (days)
ATL_TAU = 7   # fatigue time constant (days)


@dataclass(frozen=True)
class PmcPoint:
    date: date
    load: float
    ctl: float
    atl: float
    tsb: float


def daily_series(loads_by_date: dict[date, float]) -> list[tuple[date, float]]:
    """Dense day-by-day series from the first to the last activity date. Gap days = 0."""
    if not loads_by_date:
        return []
    start = min(loads_by_date)
    end = max(loads_by_date)
    out: list[tuple[date, float]] = []
    day = start
    while day <= end:
        out.append((day, loads_by_date.get(day, 0.0)))
        day += timedelta(days=1)
    return out


def compute_pmc(series: list[tuple[date, float]]) -> list[PmcPoint]:
    """CTL/ATL EWMAs and TSB for each day.

    CTL_t = CTL_{t-1} + (load_t - CTL_{t-1}) / 42
    ATL_t = ATL_{t-1} + (load_t - ATL_{t-1}) / 7
    TSB_t = CTL_{t-1} - ATL_{t-1}   (standard "yesterday" convention)
    """
    prev_ctl = 0.0
    prev_atl = 0.0
    rows: list[PmcPoint] = []
    for day, load in series:
        tsb = prev_ctl - prev_atl
        ctl = prev_ctl + (load - prev_ctl) / CTL_TAU
        atl = prev_atl + (load - prev_atl) / ATL_TAU
        rows.append(PmcPoint(date=day, load=load, ctl=ctl, atl=atl, tsb=tsb))
        prev_ctl, prev_atl = ctl, atl
    return rows


def form_label(tsb: float) -> str:
    """Three-band form label from TSB: >5 fresh, <-10 fatigued, else neutral."""
    if tsb > 5:
        return "fresh"
    if tsb < -10:
        return "fatigued"
    return "neutral"
