import pytest

from bot.progression import Progression, ProgressionConfig, Rule, monte_carlo

HUNTER_RULES = [Rule(on="loss", action="reset"), Rule(on="loss", action="inc", n=4, value=100)]


def hunter(**kw):
    cfg = dict(name="11% Hunter", bankroll=50, base=1.0, rules=HUNTER_RULES, stop_balance_above=100)
    cfg.update(kw)
    return Progression(ProgressionConfig(**cfg))


def play(p, outcomes, price=9.0):
    stakes = []
    for won in outcomes:
        stake = p.next_stake()
        stakes.append(stake)
        p.settle(won, stake * (price - 1) if won else -stake, stake)
    return stakes


def test_matches_dice_app_11pct_hunter_sizing():
    # Expected sequence taken from the Auto-Dice engine (index.html) for the same outcomes.
    # Losses are counted in total (not in a row): every loss resets, every 4th loss doubles,
    # and a win changes nothing (no win rule), so a win straight after the double keeps it.
    p = hunter()
    stakes = play(p, [False, False, False, False, True, False, False, False, False, False])
    assert stakes == [1, 1, 1, 1, 2, 2, 1, 1, 1, 2]
    assert p.bet == 1  # the 9th loss resets after the 8th loss doubled


def test_profit_target_and_bust_stop_the_session():
    p = hunter(bankroll=10, stop_balance_above=15)
    play(p, [True])                       # +8 -> 18
    assert p.stopped == "profit target reached" and p.next_stake() is None
    p = hunter(bankroll=3)
    play(p, [False, False, False])
    assert p.balance == 0 and p.stopped == "bust"


def test_balance_below_min_stake_ends_session():
    p = hunter(bankroll=1.5)
    play(p, [False])
    assert p.next_stake() is None and "minimum stake" in p.stopped


def test_rejects_base_below_exchange_minimum():
    with pytest.raises(ValueError, match="below the exchange minimum"):
        hunter(base=0.2)


def test_load_shipped_config():
    cfg = ProgressionConfig.load("progressions/11pct_hunter.json")
    assert cfg.target_odds == 9.0 and cfg.base == 1.0 and len(cfg.rules) == 2
    assert [r.action for r in cfg.rules] == ["reset", "inc"]


def test_commission_makes_the_progression_lose():
    cfg = ProgressionConfig(name="h", bankroll=50, base=1.0, rules=HUNTER_RULES, stop_balance_above=100)
    fair = monte_carlo(cfg, win_prob=1 / 9, price=9.0, commission=0.0, sessions=3000, seed=7)
    taxed = monte_carlo(cfg, win_prob=1 / 9, price=9.0, commission=0.05, sessions=3000, seed=7)
    assert fair["ev_per_bet_pct"] == pytest.approx(0.0, abs=1e-9)
    assert taxed["ev_per_bet_pct"] == pytest.approx(-4.444, abs=1e-3)
    assert taxed["avg_result"] < fair["avg_result"] and taxed["profit_rate"] < fair["profit_rate"]
