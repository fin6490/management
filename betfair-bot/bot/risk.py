"""Bankroll guard rails: daily loss limit, per-market exposure, kill switch."""
import datetime
import logging
import os

logger = logging.getLogger(__name__)


class RiskManager:
    def __init__(self, *, daily_loss_limit: float, max_market_exposure: float,
                 kill_switch_file: str = "KILL", clock=None):
        self.daily_loss_limit = daily_loss_limit
        self.max_market_exposure = max_market_exposure
        self.kill_switch_file = kill_switch_file
        self._clock = clock or (lambda: datetime.datetime.now(datetime.timezone.utc))
        self._day = self._clock().date()
        self.daily_pnl = 0.0
        self.total_pnl = 0.0
        self._exposure = {}  # market_id -> stake placed (back bets: stake = max loss)

    def _roll_day(self) -> None:
        today = self._clock().date()
        if today != self._day:
            self._day, self.daily_pnl = today, 0.0

    def halted_reason(self):
        """Why new bets are blocked, or None if trading is allowed."""
        self._roll_day()
        if self.kill_switch_file and os.path.exists(self.kill_switch_file):
            return f"kill switch file '{self.kill_switch_file}' exists"
        if self.daily_pnl <= -self.daily_loss_limit:
            return f"daily loss limit hit ({self.daily_pnl:.2f})"
        return None

    def room(self, market_id: str) -> float:
        return max(0.0, self.max_market_exposure - self._exposure.get(market_id, 0.0))

    def record_placed(self, market_id: str, stake: float) -> None:
        self._exposure[market_id] = self._exposure.get(market_id, 0.0) + stake

    def record_settled(self, market_id: str, net_pnl: float) -> None:
        self._roll_day()
        self._exposure.pop(market_id, None)
        self.daily_pnl += net_pnl
        self.total_pnl += net_pnl
        if self.daily_pnl <= -self.daily_loss_limit:
            logger.warning("Daily loss limit reached: no new bets until tomorrow")
