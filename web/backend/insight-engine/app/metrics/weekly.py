"""Weekly training load: total daily load bucketed per ISO week (keyed by Monday),
plus a recommended target derived from chronic fitness (the ACWR "sweet spot")."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from .pmc import PmcPoint

# Target acute:chronic workload ratio for the recommended line. A week whose load
# equals the chronic baseline (CTL x 7) sits at ACWR 1.0 — balanced progression.
# The injury-risk "sweet spot" runs 0.8-1.3 (Gabbett), so 1.0 is a safe, neutral
# target that neither detrains nor spikes load. Bumping this scales the line up.
TARGET_ACWR = 1.0


@dataclass(frozen=True)
class WeeklyPoint:
    week_start: date
    load: float
    recommended_load: float


def weekly_load(rows: list[PmcPoint]) -> list[WeeklyPoint]:
    """Sum the daily PMC series into ISO-week buckets, each keyed by that week's Monday.

    Each week also carries a recommended load: the chronic baseline entering the week
    — the prior day's CTL projected over seven days (CTL x 7) — scaled by the target
    ACWR. The series is dense and day-contiguous (gap days = 0), so the CTL of the day
    before a Monday is exactly the fitness carried into that week. Early weeks, before
    any chronic base has accrued, recommend near zero, which is correct.
    """
    loads: dict[date, float] = {}
    entering_ctl: dict[date, float] = {}
    prev_ctl = 0.0
    for r in rows:
        monday = r.date - timedelta(days=r.date.weekday())
        loads[monday] = loads.get(monday, 0.0) + r.load
        if monday not in entering_ctl:
            entering_ctl[monday] = prev_ctl
        prev_ctl = r.ctl
    return [
        WeeklyPoint(
            week_start=m,
            load=loads[m],
            recommended_load=entering_ctl[m] * 7 * TARGET_ACWR,
        )
        for m in sorted(loads)
    ]
