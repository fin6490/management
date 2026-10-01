"""Value-back strategy: back a runner only when the exchange price beats your model."""
import logging
from collections import OrderedDict

from flumine import BaseStrategy
from flumine.order.ordertype import LimitOrder
from flumine.order.trade import Trade
from flumine.utils import get_price

from . import staking

logger = logging.getLogger(__name__)


class ValueBackStrategy(BaseStrategy):
    """One back bet per runner, pre-race, sized by fractional Kelly.

    `fair_prices` supplies your model's probability per runner; `risk` enforces the
    loss limit, kill switch and per-market exposure. Settled results are kept in
    `self.results` (one row per market) for reporting.
    """

    def __init__(self, *args, fair_prices, settings, risk, **kwargs):
        super().__init__(*args, **kwargs)
        self.fair_prices = fair_prices
        self.settings = settings
        self.risk = risk
        self.results = []

    def check_market_book(self, market, market_book) -> bool:
        if market_book.status != "OPEN" or market_book.inplay:
            return False
        seconds = market.seconds_to_start
        return seconds is None or seconds <= self.settings.seconds_before_start

    def process_market_book(self, market, market_book) -> None:
        reason = self.risk.halted_reason()
        if reason:
            return
        s = self.settings
        for runner in market_book.runners:
            if runner.status != "ACTIVE":
                continue
            probability = self.fair_prices.get(market.market_id, runner.selection_id)
            if probability is None:
                continue
            context = self.get_runner_context(market.market_id, runner.selection_id, runner.handicap)
            if context.trade_count:
                continue  # one bet per runner
            price = get_price(runner.ex.available_to_back, 0)
            if not price:
                continue
            stake = staking.back_stake(
                probability, price,
                bankroll=s.bankroll, commission=s.commission, kelly_multiplier=s.kelly_fraction,
                min_edge=s.min_edge, min_stake=s.min_stake, max_stake=s.max_stake,
                room=self.risk.room(market.market_id),
            )
            if stake is None:
                continue
            notes = OrderedDict(probability=probability, price=price,
                                ev=round(staking.expected_value(probability, price, s.commission), 4))
            trade = Trade(market.market_id, runner.selection_id, runner.handicap, self, notes=notes)
            order = trade.create_order(side="BACK", order_type=LimitOrder(price, stake))
            if market.place_order(order):
                self.risk.record_placed(market.market_id, stake)
                logger.info("BACK %s @ %s for %.2f (p=%.3f, ev=%+.3f)", runner.selection_id,
                            price, stake, probability, notes["ev"])

    def process_closed_market(self, market, market_book) -> None:
        orders = self.blotter_orders(market)
        if not orders:
            return
        matched = [o for o in orders if o.size_matched > 0]
        gross = round(sum(o.profit for o in matched), 2)
        # Betfair charges commission on net market winnings only.
        commission = round(max(gross * self.settings.commission, 0.0), 2)
        net = round(gross - commission, 2)
        self.risk.record_settled(market.market_id, net)
        self.results.append({
            "market_id": market.market_id,
            "bets": len(orders),
            "matched": len(matched),
            "staked": round(sum(o.size_matched for o in matched), 2),
            "gross": gross,
            "commission": commission,
            "net": net,
        })
        logger.info("Settled %s: %d bets, net %+.2f (day %+.2f)",
                    market.market_id, len(orders), net, self.risk.daily_pnl)

    def blotter_orders(self, market) -> list:
        return market.blotter.strategy_orders(self)
