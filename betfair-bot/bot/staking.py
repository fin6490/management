"""Edge and stake maths for BACK bets on an exchange that charges commission.

All functions are pure so they can be unit-tested without Betfair.
"""
import math
from typing import Optional


def net_odds(price: float, commission: float) -> float:
    """Profit per 1 staked on a winning back bet, after commission on the winnings."""
    return (price - 1.0) * (1.0 - commission)


def expected_value(probability: float, price: float, commission: float) -> float:
    """Expected profit per 1 staked. Positive means the price beats your model after costs."""
    return probability * net_odds(price, commission) - (1.0 - probability)


def kelly_fraction(probability: float, price: float, commission: float) -> float:
    """Full-Kelly share of bankroll for a back bet (0 when there is no edge)."""
    b = net_odds(price, commission)
    if b <= 0:
        return 0.0
    return max(0.0, probability - (1.0 - probability) / b)


def back_stake(
    probability: float,
    price: float,
    *,
    bankroll: float,
    commission: float,
    kelly_multiplier: float,
    min_edge: float,
    min_stake: float,
    max_stake: float,
    room: float,
) -> Optional[float]:
    """Stake to back at `price`, or None when the bet should be skipped.

    Fractional Kelly, capped by `max_stake` and by `room` (exposure left in this
    market), rounded *down* to pennies. Bets below the exchange minimum are skipped
    rather than rounded up, so limits are never exceeded.
    """
    if not (0.0 < probability < 1.0) or price <= 1.0:
        return None
    if expected_value(probability, price, commission) < min_edge:
        return None
    stake = kelly_multiplier * kelly_fraction(probability, price, commission) * bankroll
    stake = min(stake, max_stake, room)
    stake = math.floor(stake * 100) / 100
    return stake if stake >= min_stake else None
