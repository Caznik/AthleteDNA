from datetime import date

from app.metrics.weekly import weekly_load


def test_weekly_load_buckets_by_iso_week_monday():
    # 2026-06-01 and 2026-06-08 are both Mondays.
    series = [
        (date(2026, 6, 1), 100.0),  # Mon  -> week of 06-01
        (date(2026, 6, 3), 50.0),   # Wed  -> week of 06-01
        (date(2026, 6, 8), 30.0),   # Mon  -> week of 06-08
    ]
    weeks = weekly_load(series)
    assert [(w.week_start, w.load) for w in weeks] == [
        (date(2026, 6, 1), 150.0),
        (date(2026, 6, 8), 30.0),
    ]


def test_weekly_week_start_is_always_monday():
    series = [(date(2026, 6, 4), 10.0)]  # Thursday
    [week] = weekly_load(series)
    assert week.week_start == date(2026, 6, 1)
    assert week.week_start.weekday() == 0


def test_weekly_empty():
    assert weekly_load([]) == []
