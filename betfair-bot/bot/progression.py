"""Bet-sizing progressions, ported from the Auto-Dice simulator's condition builder.

Same rule semantics as the dice app: after each settled bet, every rule whose
condition matches runs top to bottom ("every N wins/losses/bets", "streak of N",
"streak >= N"), then min/max bet limits apply. A session stops at the profit
target, the loss floor, bust, or a "stop" rule.

A progression only changes *how much* you bet. It cannot turn a losing bet into a
winning one: on an exchange every bet has a slightly negative expected value
unless your selection has an edge, so `monte_carlo` below should show a loss.
"""
import json
import math
import random
from dataclasses import dataclass, field
from typing import List, Optional

EVENTS = {"win", "loss", "bet"}
MODES = {"every", "streak", "streakGte"}
ACTIONS = {"inc", "dec", "reset", "set", "mult", "add", "sub", "stop"}


@dataclass
class Rule:
    on: str               # win | loss | bet
    action: str           # inc | dec | reset | set | mult | add | sub | stop
    mode: str = "every"   # every | streak | streakGte
    n: int = 1
    value: float = 0.0

    def __post_init__(self):
        if self.on not in EVENTS or self.mode not in MODES or self.action not in ACTIONS:
            raise ValueError(f"invalid rule: {self}")
        self.n = max(1, int(self.n))


@dataclass
class ProgressionConfig:
    name: str
    bankroll: float                       # session buy-in
    base: float                           # starting stake
    rules: List[Rule]
    target_odds: float = 9.0              # pick the runner priced closest to this
    odds_tolerance: float = 1.0           # ...within +/- this
    stop_balance_above: Optional[float] = None   # stop once balance >= this
    stop_balance_below: Optional[float] = None   # stop once balance <= this
    min_bet: Optional[float] = None
    max_bet: Optional[float] = None
    over_max: str = "cap"                 # cap | reset

    @classmethod
    def load(cls, path: str) -> "ProgressionConfig":
        with open(path) as fh:
            raw = json.load(fh)
        raw["rules"] = [Rule(**r) for r in raw.get("rules", [])]
        return cls(**raw)


@dataclass
class Progression:
    cfg: ProgressionConfig
    min_stake: float = 1.0                # the exchange's minimum stake
    balance: float = field(init=False)
    bet: float = field(init=False)
    bets: int = field(init=False, default=0)
    wins: int = field(init=False, default=0)
    losses: int = field(init=False, default=0)
    win_streak: int = field(init=False, default=0)
    loss_streak: int = field(init=False, default=0)
    stopped: Optional[str] = field(init=False, default=None)

    def __post_init__(self):
        self.balance = self.cfg.bankroll
        self.bet = self.cfg.base
        if self.cfg.base < self.min_stake:
            raise ValueError(
                f"base stake {self.cfg.base:.2f} is below the exchange minimum {self.min_stake:.2f}; "
                "scale the base and bankroll up together")

    def next_stake(self) -> Optional[float]:
        """Stake for the next bet, or None when the session is over."""
        if self.stopped:
            return None
        stake = math.floor(min(self.bet, self.balance) * 100) / 100
        if stake < self.min_stake:
            self.stopped = "balance below the minimum stake"
            return None
        return stake

    def _fires(self, rule: Rule, win: bool) -> bool:
        if (rule.on == "win" and not win) or (rule.on == "loss" and win):
            return False
        count = {"win": self.wins, "loss": self.losses, "bet": self.bets}[rule.on]
        streak = {"win": self.win_streak, "loss": self.loss_streak, "bet": self.bets}[rule.on]
        if rule.mode == "streak":
            return streak == rule.n
        if rule.mode == "streakGte":
            return streak >= rule.n
        return count % rule.n == 0

    def settle(self, win: bool, net_pnl: float, stake: float) -> None:
        """Record a settled bet (net_pnl after commission) and size the next one."""
        self.balance = round(self.balance + net_pnl, 8)
        self.bets += 1
        if win:
            self.wins += 1; self.win_streak += 1; self.loss_streak = 0
        else:
            self.losses += 1; self.loss_streak += 1; self.win_streak = 0

        nb, c = stake, self.cfg
        for r in c.rules:
            if not self._fires(r, win):
                continue
            if r.action == "inc": nb *= 1 + r.value / 100
            elif r.action == "dec": nb *= 1 - r.value / 100
            elif r.action == "reset": nb = c.base
            elif r.action == "set": nb = r.value
            elif r.action == "mult": nb = c.base * r.value
            elif r.action == "add": nb += r.value
            elif r.action == "sub": nb -= r.value
            elif r.action == "stop": self.stopped = "stop rule"
        if c.max_bet and nb > c.max_bet:
            nb = c.base if c.over_max == "reset" else c.max_bet
        if c.min_bet and nb < c.min_bet:
            nb = c.min_bet
        self.bet = max(nb, self.min_stake)

        if self.balance <= 0:
            self.stopped = self.stopped or "bust"
        elif c.stop_balance_above is not None and self.balance >= c.stop_balance_above:
            self.stopped = self.stopped or "profit target reached"
        elif c.stop_balance_below is not None and self.balance <= c.stop_balance_below:
            self.stopped = self.stopped or "loss floor reached"


def monte_carlo(cfg: ProgressionConfig, *, win_prob: float, price: float, commission: float,
                min_stake: float = 1.0, sessions: int = 20_000, max_bets: int = 10_000,
                seed: Optional[int] = None) -> dict:
    """Simulate whole sessions at a fixed price and true win chance.

    Commission is charged on each winning bet (each bet is its own market here).
    """
    rng = random.Random(seed)
    results, busts, total_bets = [], 0, 0
    for _ in range(sessions):
        p = Progression(cfg, min_stake=min_stake)
        while p.bets < max_bets:
            stake = p.next_stake()
            if stake is None:
                break
            win = rng.random() < win_prob
            net = stake * (price - 1) * (1 - commission) if win else -stake
            p.settle(win, net, stake)
        results.append(p.balance - cfg.bankroll)
        busts += p.balance < min_stake and p.stopped != "profit target reached"
        total_bets += p.bets
    results.sort()
    n = len(results)
    return {
        "sessions": n,
        "profit_rate": sum(r > 0 for r in results) / n,
        "bust_rate": busts / n,
        "avg_result": sum(results) / n,
        "avg_bets": total_bets / n,
        "ev_per_bet_pct": 100 * (win_prob * (price - 1) * (1 - commission) - (1 - win_prob)),
        "p10": results[int(n * 0.10)],
        "median": results[n // 2],
        "p90": results[min(n - 1, int(n * 0.90))],
    }
