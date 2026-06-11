from datetime import date

from app.metrics.pmc import compute_pmc, daily_series
from app.metrics.weekly import TARGET_ACWR, weekly_load


def _rows(series):
    """Dense PMC rows over a sparse (date, load) series — the engine's real input shape."""
    return compute_pmc(daily_series(dict(series)))


def test_weekly_load_buckets_by_iso_week_monday():
    # 2026-06-01 and 2026-06-08 are both Mondays.
    rows = _rows([
        (date(2026, 6, 1), 100.0),  # Mon  -> week of 06-01
        (date(2026, 6, 3), 50.0),   # Wed  -> week of 06-01
        (date(2026, 6, 8), 30.0),   # Mon  -> week of 06-08
    ])
    weeks = weekly_load(rows)
    assert [(w.week_start, w.load) for w in weeks] == [
        (date(2026, 6, 1), 150.0),
        (date(2026, 6, 8), 30.0),
    ]


def test_weekly_week_start_is_always_monday():
    rows = _rows([(date(2026, 6, 4), 10.0)])  # Thursday
    [week] = weekly_load(rows)
    assert week.week_start == date(2026, 6, 1)
    assert week.week_start.weekday() == 0


def test_weekly_recommended_load_tracks_chronic_baseline():
    # Two full weeks of steady load starting Monday 2026-06-01.
    rows = _rows([(date(2026, 6, d), 100.0) for d in range(1, 15)])
    weeks = weekly_load(rows)
    # The first week opens with zero accrued fitness, so the recommendation is ~0.
    assert weeks[0].recommended_load == 0.0
    # The second week's target is the CTL carried in from Sunday 06-07, projected to a
    # full week and scaled by the target ACWR.
    sunday_ctl = next(r.ctl for r in rows if r.date == date(2026, 6, 7))
    assert weeks[1].recommended_load == sunday_ctl * 7 * TARGET_ACWR


def test_weekly_empty():
    assert weekly_load([]) == []
