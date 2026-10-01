"""End-to-end: replay a synthetic Betfair stream file through flumine's simulator."""
import os

import pytest

import run_backtest
from tests.fixtures import make_market


@pytest.fixture
def env(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)  # no stray .env / KILL file
    for k, v in dict(BANKROLL="100", KELLY_FRACTION="0.25", MIN_EDGE="0.03", MIN_STAKE="1",
                     MAX_STAKE="5", MAX_MARKET_EXPOSURE="10", COMMISSION="0.05",
                     SECONDS_BEFORE_START="300").items():
        monkeypatch.setenv(k, v)
    market = make_market.write(str(tmp_path / "market.json"))
    return tmp_path, market


def run(tmp_path, market, csv):
    (tmp_path / "fp.csv").write_text(csv)
    return run_backtest.main([market, "--fair-prices", str(tmp_path / "fp.csv"), "--quiet"])


def test_backs_only_the_value_runner_and_settles_with_commission(env):
    tmp_path, market = env
    s = run(tmp_path, market, make_market.FAIR_PRICES)
    # 101 @ 3.0 vs 40% model: quarter-Kelly stake 2.10, wins 4.20, 5% commission -> +3.99
    assert s == {"markets": 1, "bets": 1, "matched_bets": 1, "staked": 2.1,
                 "commission": 0.21, "net_pnl": 3.99, "roi_pct": 190.0, "winning_markets": 1}


def test_losing_bet_pays_no_commission(env):
    tmp_path, market = env
    csv = f"market_id,selection_id,probability\n{make_market.MARKET_ID},103,0.30\n"
    s = run(tmp_path, market, csv)
    # 103 @ 6.0 vs 30%: kelly 0.3-0.7/4.75 = 0.1526 -> 25% x 100 = 3.81; it loses
    assert s["bets"] == 1 and s["staked"] == 3.81
    assert s["net_pnl"] == -3.81 and s["commission"] == 0.0


def test_no_bets_without_value(env):
    tmp_path, market = env
    csv = f"market_id,selection_id,probability\n{make_market.MARKET_ID},102,0.30\n"
    assert run(tmp_path, market, csv)["bets"] == 0
