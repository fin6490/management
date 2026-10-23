"""Settings loaded from environment variables (see .env.example)."""
import os
from dataclasses import dataclass, field


def _load_dotenv(path: str = ".env") -> None:
    """Minimal .env loader so the bot has no extra dependency. Real env vars win."""
    if not os.path.exists(path):
        return
    with open(path) as fh:
        for line in fh:
            line = line.split("#", 1)[0].strip()
            if "=" in line:
                key, value = (part.strip() for part in line.split("=", 1))
                os.environ.setdefault(key, value)


def _f(name: str, default: float) -> float:
    return float(os.environ.get(name, default))


def _list(name: str, default: str) -> list:
    return [v.strip() for v in os.environ.get(name, default).split(",") if v.strip()]


@dataclass
class Settings:
    username: str = ""
    password: str = ""
    app_key: str = ""
    certs_dir: str = "./certs"

    bankroll: float = 100.0
    kelly_fraction: float = 0.25
    min_edge: float = 0.03
    min_stake: float = 1.0
    max_stake: float = 5.0
    max_market_exposure: float = 10.0
    daily_loss_limit: float = 20.0
    commission: float = 0.05
    kill_switch_file: str = "KILL"

    event_type_ids: list = field(default_factory=lambda: ["7"])
    country_codes: list = field(default_factory=lambda: ["GB", "IE"])
    market_types: list = field(default_factory=lambda: ["WIN"])
    seconds_before_start: float = 300.0

    fair_prices_csv: str = "data/fair_prices.csv"

    @classmethod
    def from_env(cls, dotenv: str = ".env") -> "Settings":
        _load_dotenv(dotenv)
        return cls(
            username=os.environ.get("BF_USERNAME", ""),
            password=os.environ.get("BF_PASSWORD", ""),
            app_key=os.environ.get("BF_APP_KEY", ""),
            certs_dir=os.environ.get("BF_CERTS_DIR", "./certs"),
            bankroll=_f("BANKROLL", 100),
            kelly_fraction=_f("KELLY_FRACTION", 0.25),
            min_edge=_f("MIN_EDGE", 0.03),
            min_stake=_f("MIN_STAKE", 1.0),
            max_stake=_f("MAX_STAKE", 5.0),
            max_market_exposure=_f("MAX_MARKET_EXPOSURE", 10.0),
            daily_loss_limit=_f("DAILY_LOSS_LIMIT", 20.0),
            commission=_f("COMMISSION", 0.05),
            kill_switch_file=os.environ.get("KILL_SWITCH_FILE", "KILL"),
            event_type_ids=_list("EVENT_TYPE_IDS", "7"),
            country_codes=_list("COUNTRY_CODES", "GB,IE"),
            market_types=_list("MARKET_TYPES", "WIN"),
            seconds_before_start=_f("SECONDS_BEFORE_START", 300),
            fair_prices_csv=os.environ.get("FAIR_PRICES_CSV", "data/fair_prices.csv"),
        )
