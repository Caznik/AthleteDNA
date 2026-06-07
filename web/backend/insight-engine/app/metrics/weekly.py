"""Weekly training load: total daily load bucketed per ISO week (keyed by Monday)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class WeeklyPoint:
    week_start: date
    load: float


def weekly_load(series: list[tuple[date, float]]) -> list[WeeklyPoint]:
    """Sum the daily series into ISO-week buckets, each keyed by that week's Monday."""
    buckets: dict[date, float] = {}
    for day, load in series:
        monday = day - timedelta(days=day.weekday())
        buckets[monday] = buckets.get(monday, 0.0) + load
    return [WeeklyPoint(week_start=m, load=buckets[m]) for m in sorted(buckets)]
