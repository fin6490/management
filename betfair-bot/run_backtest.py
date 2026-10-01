"""Replay Betfair historical stream files through the strategy (no money, no login).

Usage:
    python run_backtest.py data/historic/*.bz2 --fair-prices data/fair_prices.csv
"""
import argparse
import glob
import logging

from flumine import FlumineSimulation, clients
from flumine.streams.betfairhistoricalstream import BetfairHistoricalStream

from bot.config import Settings
from bot.fair_prices import CsvFairPrices
from bot.report import format_summary, summarise
from bot.risk import RiskManager
from bot.strategy import ValueBackStrategy


def build(files, settings, fair_prices):
    risk = RiskManager(daily_loss_limit=settings.daily_loss_limit,
                       max_market_exposure=settings.max_market_exposure,
                       kill_switch_file=None)  # a stray KILL file shouldn't stop a backtest
    streams = [
        BetfairHistoricalStream(file_path=f, listener_kwargs={"inplay": False})
        for f in files
    ]
    strategy = ValueBackStrategy(streams=streams, fair_prices=fair_prices, settings=settings,
                                 risk=risk, max_order_exposure=settings.max_stake,
                                 max_selection_exposure=settings.max_market_exposure)
    framework = FlumineSimulation(client=clients.SimulatedClient())
    framework.add_strategy(strategy)
    return framework, strategy


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="+", help="historical stream files or glob patterns")
    parser.add_argument("--fair-prices", help="CSV of market_id,selection_id,probability")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.WARNING if args.quiet else logging.INFO,
                        format="%(levelname)s %(name)s: %(message)s")

    settings = Settings.from_env()
    files = sorted({f for pattern in args.files for f in glob.glob(pattern, recursive=True)})
    if not files:
        parser.error("no historical files matched")
    fair_prices = CsvFairPrices(args.fair_prices or settings.fair_prices_csv)
    if not len(fair_prices):
        parser.error("no fair prices loaded: the strategy needs your model's probabilities to bet")

    framework, strategy = build(files, settings, fair_prices)
    framework.run()
    summary = summarise(strategy.results)
    print(format_summary(summary))
    return summary


if __name__ == "__main__":
    main()
