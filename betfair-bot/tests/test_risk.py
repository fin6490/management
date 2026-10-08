import datetime

from bot.risk import RiskManager


class Clock:
    def __init__(self):
        self.now = datetime.datetime(2026, 1, 1, 12, tzinfo=datetime.timezone.utc)

    def __call__(self):
        return self.now


def test_room_tracks_exposure_per_market():
    r = RiskManager(daily_loss_limit=20, max_market_exposure=10, kill_switch_file=None)
    r.record_placed("1.1", 4)
    assert r.room("1.1") == 6 and r.room("1.2") == 10
    r.record_settled("1.1", -4)
    assert r.room("1.1") == 10


def test_daily_loss_limit_halts_until_next_day():
    clock = Clock()
    r = RiskManager(daily_loss_limit=20, max_market_exposure=10, kill_switch_file=None, clock=clock)
    r.record_settled("1.1", -12)
    assert r.halted_reason() is None
    r.record_settled("1.2", -8)
    assert "daily loss limit" in r.halted_reason()
    clock.now += datetime.timedelta(days=1)
    assert r.halted_reason() is None and r.total_pnl == -20


def test_kill_switch_file(tmp_path):
    kill = tmp_path / "KILL"
    r = RiskManager(daily_loss_limit=20, max_market_exposure=10, kill_switch_file=str(kill))
    assert r.halted_reason() is None
    kill.write_text("")
    assert "kill switch" in r.halted_reason()
