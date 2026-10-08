import pytest

from bot import staking

KW = dict(bankroll=100, commission=0.05, kelly_multiplier=0.25, min_edge=0.03,
          min_stake=1.0, max_stake=5.0, room=10.0)


def test_expected_value_includes_commission():
    # 40% at 3.0: (3-1)*0.95 = 1.9 profit on a win -> 0.4*1.9 - 0.6 = +0.16
    assert staking.expected_value(0.40, 3.0, 0.05) == pytest.approx(0.16)
    # a fair price is negative once commission is charged
    assert staking.expected_value(0.50, 2.0, 0.05) < 0


def test_kelly_zero_without_edge():
    assert staking.kelly_fraction(0.40, 2.2, 0.05) == 0.0
    assert staking.kelly_fraction(0.40, 3.0, 0.05) == pytest.approx(0.4 - 0.6 / 1.9)


def test_stake_quarter_kelly_rounded_down():
    assert staking.back_stake(0.40, 3.0, **KW) == 2.10


def test_stake_skipped_below_min_edge_or_min_stake():
    assert staking.back_stake(0.40, 2.6, **KW) is None             # EV +0.008 < 3%
    assert staking.back_stake(0.40, 3.0, **{**KW, "bankroll": 20}) is None  # 0.42 < 1.00 min


def test_stake_capped_by_max_and_room():
    big = {**KW, "bankroll": 10_000}
    assert staking.back_stake(0.40, 3.0, **big) == 5.0
    assert staking.back_stake(0.40, 3.0, **{**big, "room": 3.337}) == 3.33


@pytest.mark.parametrize("p,price", [(0, 3.0), (1, 3.0), (0.4, 1.0)])
def test_stake_rejects_invalid_inputs(p, price):
    assert staking.back_stake(p, price, **KW) is None
