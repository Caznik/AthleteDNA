"""Personal records per activity type: max distance, max duration, best pace."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PersonalRecord:
    type: str
    max_distance: float
    max_duration: int
    best_pace_sec_per_km: float | None


def personal_records(activities) -> list[PersonalRecord]:
    """Per-type bests over the supplied activities.

    `activities` is any iterable of objects exposing `type`, `distance` (meters) and
    `duration` (seconds). Best pace is the minimum seconds-per-km over activities with a
    positive distance (zero-distance activities are skipped for pace only).
    """
    agg: dict[str, dict] = {}
    for a in activities:
        rec = agg.setdefault(
            a.type, {"max_distance": 0.0, "max_duration": 0, "best_pace": None}
        )
        distance = a.distance or 0.0
        duration = a.duration or 0
        if distance > rec["max_distance"]:
            rec["max_distance"] = distance
        if duration > rec["max_duration"]:
            rec["max_duration"] = duration
        if distance > 0 and duration > 0:
            pace = duration / (distance / 1000.0)  # seconds per kilometer
            if rec["best_pace"] is None or pace < rec["best_pace"]:
                rec["best_pace"] = pace

    return [
        PersonalRecord(
            type=t,
            max_distance=rec["max_distance"],
            max_duration=rec["max_duration"],
            best_pace_sec_per_km=rec["best_pace"],
        )
        for t, rec in sorted(agg.items())
    ]
