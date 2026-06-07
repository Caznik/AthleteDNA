from types import SimpleNamespace

from app.metrics.prs import personal_records


def _a(type, distance, duration):
    return SimpleNamespace(type=type, distance=distance, duration=duration)


def test_personal_records_per_type():
    prs = {
        p.type: p
        for p in personal_records(
            [
                _a("Run", 10000.0, 3000),   # 300 s/km
                _a("Run", 21097.0, 7200),   # ~341 s/km
                _a("Ride", 30000.0, 3600),  # 120 s/km
            ]
        )
    }
    assert prs["Run"].max_distance == 21097.0
    assert prs["Run"].max_duration == 7200
    assert prs["Run"].best_pace_sec_per_km == 300.0  # the faster of the two runs
    assert prs["Ride"].max_distance == 30000.0
    assert prs["Ride"].best_pace_sec_per_km == 120.0


def test_personal_records_ignores_zero_distance_for_pace():
    [pr] = personal_records([_a("Run", 0.0, 600)])
    assert pr.best_pace_sec_per_km is None
    assert pr.max_duration == 600


def test_personal_records_empty():
    assert personal_records([]) == []
