from app.metrics.load import LOAD_NORMALIZER, default_hr, score


def test_score_uses_avg_hr_when_present():
    assert score(duration=3600, avg_hr=150, activity_type="Run") == (3600 * 150) / LOAD_NORMALIZER


def test_score_falls_back_to_default_hr_when_avg_hr_null():
    # AC-2: a null-HR activity contributes via default_hr(type), not 0.
    expected = (3600 * default_hr("Run")) / LOAD_NORMALIZER
    result = score(duration=3600, avg_hr=None, activity_type="Run")
    assert result == expected
    assert result > 0


def test_default_hr_unknown_type_uses_fallback():
    assert default_hr("Kayak") == default_hr(None)


def test_score_zero_or_missing_duration_is_zero():
    assert score(duration=0, avg_hr=150, activity_type="Run") == 0.0
    assert score(duration=None, avg_hr=150, activity_type="Run") == 0.0
