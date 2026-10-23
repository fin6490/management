"""Run a dice-style progression on Betfair: one back bet at a time on the runner
priced closest to the target odds, staked by the progression's rules."""
import logging
from collections import OrderedDict

from flumine import BaseStrategy
from flumine.order.ordertype import LimitOrder
from flumine.order.trade import Trade
from flumine.utils import get_price

logger = logging.getLogger(__name__)


class ProgressionStrategy(BaseStrategy):
    """The next stake depends on the last result, so only one bet is open at a time:
    new markets are skipped until the pending bet's market settles."""

    def __init__(self, *args, progression, settings, risk, **kwargs):
        super().__init__(*args, **kwargs)
        self.progression = progression
        self.settings = settings
        self.risk = risk
        self.pending_market = None
        self.results = []

    def check_market_book(self, market, market_book) -> bool:
        if market_book.status != "OPEN" or market_book.inplay:
            return False
        seconds = market.seconds_to_start
        return seconds is None or seconds <= self.settings.seconds_before_start

    def pick_runner(self, market_book):
        cfg = self.progression.cfg
        best = None
        for runner in market_book.runners:
            if runner.status != "ACTIVE":
                continue
            price = get_price(runner.ex.available_to_back, 0)
            if not price or abs(price - cfg.target_odds) > cfg.odds_tolerance:
                continue
            gap = abs(price - cfg.target_odds)
            if best is None or gap < best[0]:
                best = (gap, runner, price)
        return best[1:] if best else None

    def process_market_book(self, market, market_book) -> None:
        if self.pending_market or self.progression.stopped or self.risk.halted_reason():
            return
        picked = self.pick_runner(market_book)
        if not picked:
            return
        runner, price = picked
        stake = self.progression.next_stake()
        if stake is None:
            logger.warning("Progression '%s' finished: %s (balance %.2f)",
                           self.progression.cfg.name, self.progression.stopped, self.progression.balance)
            return
        stake = min(stake, self.risk.room(market.market_id))
        if stake < self.progression.min_stake:
            return
        trade = Trade(market.market_id, runner.selection_id, runner.handicap, self,
                      notes=OrderedDict(price=price, bet_no=self.progression.bets + 1))
        order = trade.create_order(side="BACK", order_type=LimitOrder(price, stake))
        if market.place_order(order):
            self.pending_market = market.market_id
            self.risk.record_placed(market.market_id, stake)
            logger.info("BACK %s @ %s for %.2f (bet %d, balance %.2f)", runner.selection_id,
                        price, stake, self.progression.bets + 1, self.progression.balance)

    def process_closed_market(self, market, market_book) -> None:
        if market.market_id != self.pending_market:
            return
        self.pending_market = None
        matched = [o for o in market.blotter.strategy_orders(self) if o.size_matched > 0]
        if not matched:
            logger.info("Bet in %s was not matched; progression unchanged", market.market_id)
            return
        stake = round(sum(o.size_matched for o in matched), 2)
        gross = round(sum(o.profit for o in matched), 2)
        commission = round(max(gross * self.settings.commission, 0.0), 2)
        net = round(gross - commission, 2)
        win = gross > 0
        self.progression.settle(win, net, stake)
        self.risk.record_settled(market.market_id, net)
        self.results.append({
            "market_id": market.market_id, "bets": len(matched), "matched": len(matched),
            "staked": stake, "gross": gross, "commission": commission, "net": net,
            "balance": round(self.progression.balance, 2),
        })
        logger.info("%s %s: net %+.2f, balance %.2f, next stake %.2f%s",
                    "WIN" if win else "LOSS", market.market_id, net, self.progression.balance,
                    self.progression.bet,
                    f" [session over: {self.progression.stopped}]" if self.progression.stopped else "")
