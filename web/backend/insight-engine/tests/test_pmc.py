from datetime import date

import pytest

from app.metrics.pmc import compute_pmc, daily_series, form_label


def test_compute_pmc_matches_hand_computed_vector():
    # Three consecutive days, each with a daily load of exactly 100.
    #   CTL_t = CTL_{t-1} + (load - CTL_{t-1})/42
    #   ATL_t = ATL_{t-1} + (load - ATL_{t-1})/7
    #   TSB_t = CTL_{t-1} - ATL_{t-1}
    series = [
        (date(2026, 6, 1), 100.0),
        (date(2026, 6, 2), 100.0),
        (date(2026, 6, 3), 100.0),
    ]
    rows = compute_pmc(series)

    # Day 1: seeded from 0.
    assert rows[0].tsb == pytest.approx(0.0)
    assert rows[0].ctl == pytest.approx(100.0 / 42)
    assert rows[0].atl == pytest.approx(100.0 / 7)
    # Day 2.
    assert rows[1].tsb == pytest.approx(100.0 / 42 - 100.0 / 7)
    assert rows[1].ctl == pytest.approx(4.705215419501134)
    assert rows[1].atl == pytest.approx(26.53061224489796)
    # Day 3.
    assert rows[2].tsb == pytest.approx(-21.825396825396826)
    assert rows[2].ctl == pytest.approx(6.974138861893)
    assert rows[2].atl == pytest.approx(37.026239067055)


def test_daily_series_fills_gap_days_with_zero():
    loads = {date(2026, 6, 1): 100.0, date(2026, 6, 3): 50.0}
    assert daily_series(loads) == [
        (date(2026, 6, 1), 100.0),
        (date(2026, 6, 2), 0.0),
        (date(2026, 6, 3), 50.0),
    ]


def test_daily_series_empty():
    assert daily_series({}) == []


@pytest.mark.parametrize(
    "tsb,label",
    [(10, "fresh"), (5.0, "neutral"), (0, "neutral"), (-10, "neutral"), (-10.1, "fatigued")],
)
def test_form_label_bands(tsb, label):
    assert form_label(tsb) == label
