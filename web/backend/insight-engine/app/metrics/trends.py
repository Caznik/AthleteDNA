"""Simple trends: CTL ramp rate (per week) and TSB direction."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from .pmc import PmcPoint

_EPS = 1e-9


@dataclass(frozen=True)
class Trends:
    ctl_ramp_per_week: float
    tsb_direction: str


def compute_trends(rows: list[PmcPoint]) -> Trends:
    """CTL change over the last 7 days, and whether TSB is rising/falling/flat."""
    if not rows:
        return Trends(ctl_ramp_per_week=0.0, tsb_direction="flat")

    ctl_by_date = {r.date: r.ctl for r in rows}
    last = rows[-1]
    # CTL seven days before the most recent day; 0.0 if that date precedes the series
    # (the EWMA seed), so a short history still yields a sensible ramp.
    ctl_ref = ctl_by_date.get(last.date - timedelta(days=7), 0.0)
    ramp = last.ctl - ctl_ref

    tsb_prev = rows[-2].tsb if len(rows) >= 2 else 0.0
    diff = last.tsb - tsb_prev
    if diff > _EPS:
        direction = "rising"
    elif diff < -_EPS:
        direction = "falling"
    else:
        direction = "flat"

    return Trends(ctl_ramp_per_week=ramp, tsb_direction=direction)
