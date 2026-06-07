from datetime import date

from app.metrics.pmc import compute_pmc
from app.metrics.trends import compute_trends


def test_trends_empty_is_flat():
    t = compute_trends([])
    assert t.ctl_ramp_per_week == 0.0
    assert t.tsb_direction == "flat"


def test_trends_three_constant_days():
    rows = compute_pmc(
        [(date(2026, 6, 1), 100.0), (date(2026, 6, 2), 100.0), (date(2026, 6, 3), 100.0)]
    )
    t = compute_trends(rows)
    # The reference day (last - 7d) precedes the series, so CTL_ref = 0 and the ramp is
    # just the most recent CTL.
    assert t.ctl_ramp_per_week == rows[-1].ctl
    # TSB goes 0 -> -11.9 -> -21.8, so the last step is downward.
    assert t.tsb_direction == "falling"
