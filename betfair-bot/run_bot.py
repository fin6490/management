"""Run the strategy on live Betfair prices.

    python run_bot.py --mode paper                      # live prices, simulated bets (default)
    python run_bot.py --mode live --i-accept-real-money # real bets with real money

Paper mode logs in and streams real markets, but no order ever reaches Betfair.
Create the kill-switch file (default: KILL) at any time to stop new bets.
"""
import argparse
import logging
import os
import sys

import betfairlightweight
from betfairlightweight.filters import streaming_market_data_filter, streaming_market_filter
from flumine import Flumine, clients
from flumine.streams.betfairmarketstream import BetfairMarketStream

from bot.config import Settings
from bot.fair_prices import CsvFairPrices
from bot.risk import RiskManager
from bot.strategy import ValueBackStrategy


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--mode", choices=["paper", "live"], default="paper")
    parser.add_argument("--i-accept-real-money", action="store_true",
                        help="required with --mode live")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    if args.mode == "live" and not args.i_accept_real_money:
        sys.exit("Refusing to place real bets without --i-accept-real-money.")

    s = Settings.from_env()
    missing = [k for k, v in {"BF_USERNAME": s.username, "BF_PASSWORD": s.password,
                              "BF_APP_KEY": s.app_key}.items() if not v]
    if missing:
        sys.exit(f"Missing settings: {', '.join(missing)} (copy .env.example to .env)")
    if not os.path.isdir(s.certs_dir):
        sys.exit(f"Certificate folder not found: {s.certs_dir} (needed for non-interactive login)")

    fair_prices = CsvFairPrices(s.fair_prices_csv)
    if not len(fair_prices):
        sys.exit(f"No fair prices in {s.fair_prices_csv}: the bot only bets where your model has a price.")

    trading = betfairlightweight.APIClient(s.username, s.password, app_key=s.app_key, certs=s.certs_dir)
    client = clients.BetfairClient(trading, paper_trade=(args.mode == "paper"),
                                   commission_base=s.commission)
    framework = Flumine(client=client)

    stream = BetfairMarketStream(
        market_filter=streaming_market_filter(event_type_ids=s.event_type_ids,
                                              country_codes=s.country_codes,
                                              market_types=s.market_types),
        market_data_filter=streaming_market_data_filter(fields=["EX_BEST_OFFERS", "EX_MARKET_DEF"],
                                                        ladder_levels=3),
    )
    risk = RiskManager(daily_loss_limit=s.daily_loss_limit, max_market_exposure=s.max_market_exposure,
                       kill_switch_file=s.kill_switch_file)
    framework.add_strategy(ValueBackStrategy(
        stream=stream, fair_prices=fair_prices, settings=s, risk=risk,
        max_order_exposure=s.max_stake, max_selection_exposure=s.max_market_exposure,
    ))
    logging.getLogger(__name__).info("Starting in %s mode", args.mode.upper())
    framework.run()


if __name__ == "__main__":
    main()
