"""Per-activity stress score (v1).

The single swappable scoring function lives here. Swapping it (e.g. for a calibrated
TRIMP/HRSS once the user-physiology profile fields exist) does not touch the PMC
machinery, which only consumes the resulting daily load totals.
"""
from __future__ import annotations

# Cosmetic normalizer: a ~1-hour effort at ~150 bpm (3600 s * 150 / 5400) lands at
# ~100 load points, a TSS-like scale. Tunable; the PMC *shape* is independent of it.
LOAD_NORMALIZER = 5400.0

# Fallback heart rate per activity type, used only when an activity has no average HR,
# so HR-less activities still contribute load instead of scoring 0 (the v1 fallback).
_DEFAULT_HR_BY_TYPE = {"Run": 140, "Ride": 125}
_FALLBACK_HR = 120


def default_hr(activity_type: str | None) -> int:
    """Assumed average HR for an activity type with no recorded HR."""
    return _DEFAULT_HR_BY_TYPE.get(activity_type or "", _FALLBACK_HR)


def score(*, duration: int | None, avg_hr: int | None, activity_type: str | None) -> float:
    """v1 stress score: duration(seconds) x HR / normalizer.

    Null `avg_hr` uses `default_hr(activity_type)` so the activity still contributes.
    """
    hr = avg_hr if avg_hr is not None else default_hr(activity_type)
    dur = duration or 0
    return (dur * hr) / LOAD_NORMALIZER
