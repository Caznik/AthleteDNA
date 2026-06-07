from datetime import datetime, timezone
from types import SimpleNamespace

from app.metrics.insights import compute


def _a(type="Run", distance=10000.0, duration=3600, avg_hr=150, start_date=None):
    return SimpleNamespace(
        type=type, distance=distance, duration=duration, avg_hr=avg_hr, start_date=start_date
    )


def test_empty_history_returns_zeroed_result():
    # AC-4: empty history -> zeroed/empty, never an error.
    r = compute([])
    assert r.pmc.series == []
    assert r.pmc.current.ctl == 0.0
    assert r.pmc.current.atl == 0.0
    assert r.pmc.current.tsb == 0.0
    assert r.pmc.current.form_label == "neutral"
    assert r.weekly_load == []
    assert r.trends.tsb_direction == "flat"
    assert r.prs == []


def test_all_hr_less_history_still_produces_load():
    # AC-2/AC-4: a history with no HR data at all still yields positive load.
    acts = [_a(avg_hr=None, start_date=datetime(2026, 6, 1, 7, tzinfo=timezone.utc))]
    r = compute(acts)
    assert r.pmc.series[0].load > 0


def test_same_day_activities_loads_sum():
    morning = datetime(2026, 6, 1, 7, tzinfo=timezone.utc)
    evening = datetime(2026, 6, 1, 18, tzinfo=timezone.utc)
    one = compute([_a(start_date=morning)])
    two = compute([_a(start_date=morning), _a(start_date=evening)])
    assert two.pmc.series[0].load == 2 * one.pmc.series[0].load


def test_naive_datetime_treated_as_utc():
    aware = compute([_a(start_date=datetime(2026, 6, 1, 7, tzinfo=timezone.utc))])
    naive = compute([_a(start_date=datetime(2026, 6, 1, 7))])
    assert [str(p.date) for p in naive.pmc.series] == [str(p.date) for p in aware.pmc.series]


def test_undated_activity_skipped_in_series_but_counts_for_prs():
    r = compute([_a(start_date=None, distance=42195.0, duration=10000)])
    assert r.pmc.series == []
    assert r.prs[0].max_distance == 42195.0
