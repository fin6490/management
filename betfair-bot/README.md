# Betfair value-betting bot

An automated Betfair Exchange bot built on [flumine](https://github.com/betcode-org/flumine)
and [betfairlightweight](https://github.com/betcode-org/betfair). It backs a runner only when
the exchange price beats **your own model's probability** after commission, sizes the stake with
fractional Kelly, and enforces hard risk limits.

It runs in three modes, in the order you should use them:

| Mode | Prices | Bets | Needs |
|---|---|---|---|
| `run_backtest.py` | Betfair historical files | Simulated | Historical data + your model's prices |
| `run_bot.py --mode paper` | Live stream | Simulated (nothing sent to Betfair) | Account, app key, certificates |
| `run_bot.py --mode live --i-accept-real-money` | Live stream | **Real money** | All of the above + a live app key |

## Read this first

- **The bot has no edge of its own.** It only bets when `data/fair_prices.csv` (your model)
  says a runner's true chance is higher than the exchange price implies. If your model isn't
  better than the market, the bot will lose roughly the commission on every pound it stakes.
- **Staking systems don't create edge.** Martingale, doubling after wins and similar
  progressions (as tested in the Auto-Dice simulator) lose on an exchange because of commission.
  This bot deliberately sizes bets from the edge (Kelly), not from streaks.
- Backtest on months of data, then paper-trade for hundreds of bets, before going live with
  small limits. Only stake money you can afford to lose.

## Setup

```bash
cd betfair-bot
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill it in
python -m pytest -q         # 17 tests, no Betfair account needed
```

### Betfair account pieces

1. **App key.** Create one from the Betfair developer program. A *delayed* key is free and fine
   for paper mode. Real betting needs a *live* key, which Betfair charges a one-off fee for
   (check their developer site for the current terms).
2. **Certificates.** For unattended login, create a self-signed certificate, upload the `.crt`
   to your Betfair account's security settings, and put the `.crt` and `.key` files in
   `./certs` (or set `BF_CERTS_DIR`). The `certs/` folder is git-ignored.
3. Put your username, password and app key in `.env`. It is git-ignored; never commit it.

Betfair is not available in every country (for example the US). Make sure you are allowed to use it.

## Your model: `data/fair_prices.csv`

```csv
market_id,selection_id,probability
1.234567890,12345678,0.31
1.234567890,23456789,0.18
```

`probability` is your model's chance (0 to 1) that the runner wins. The bot backs runner X in
market M only if:

```
expected value = p × (price − 1) × (1 − commission) − (1 − p)  ≥  MIN_EDGE
```

To use a model directly instead of a CSV, write a class with
`get(market_id, selection_id) -> probability | None` and pass it in place of `CsvFairPrices`.

## Backtest

Download Betfair historical stream data (ADVANCED or PRO tier; BASIC has no price ladders, so the
bot can't see back prices). Then:

```bash
python run_backtest.py "data/historic/**/*.bz2" --fair-prices data/fair_prices.csv
```

Example output (from the synthetic test market in `tests/fixtures`):

```
Markets settled : 1
Bets placed     : 1 (1 matched)
Total staked    : 2.10
Commission      : 0.21
Net P/L         : +3.99
ROI             : +190.00%
Winning markets : 1 of 1
```

Commission is charged the way Betfair does it: on net winnings per market, nothing on a losing
market. Note that the simulator assumes your bets don't move the market, so results on thin
markets will be optimistic.

## Paper and live

```bash
python run_bot.py --mode paper                         # live prices, simulated bets
python run_bot.py --mode live --i-accept-real-money    # real bets
```

The stream is set by `EVENT_TYPE_IDS`, `COUNTRY_CODES` and `MARKET_TYPES` (default: GB/IE
horse-racing WIN markets). The bot only bets in the last `SECONDS_BEFORE_START` seconds before
the off, never in-play, and at most once per runner. Unmatched bets lapse at the off.

## Risk controls

| Setting | Default | What it does |
|---|---|---|
| `KELLY_FRACTION` | 0.25 | Bet a quarter of the full-Kelly stake (full Kelly is too volatile when your model is uncertain) |
| `MIN_EDGE` | 0.03 | Skip bets under +3% expected value after commission |
| `MIN_STAKE` / `MAX_STAKE` | 1.00 / 5.00 | Below the minimum is skipped, never rounded up; above the cap is cut |
| `MAX_MARKET_EXPOSURE` | 10.00 | Most money at risk in one market |
| `DAILY_LOSS_LIMIT` | 20.00 | No new bets for the rest of the UTC day once hit |
| `KILL_SWITCH_FILE` | `KILL` | `touch KILL` stops new bets immediately; delete it to resume |

flumine's own controls (order validation, strategy exposure) also apply.

## Layout

```
bot/config.py        settings from .env
bot/staking.py       expected value and Kelly stake maths (pure functions)
bot/fair_prices.py   your model's probabilities
bot/risk.py          loss limit, exposure, kill switch
bot/strategy.py      the flumine strategy
bot/report.py        backtest summary
run_backtest.py      historical replay
run_bot.py           paper / live
tests/               unit tests + an end-to-end backtest on a synthetic market file
```

## Next steps

- Build the model: ratings, form or a price model, and check it against the market's own
  prices first. If your probabilities aren't better calibrated than the Betfair starting price,
  there is no edge to automate.
- Track each bet's price against the starting price (closing line value). It's the fastest
  signal of whether you have an edge.
- Smarkets has an API too; adding it means a second client and order handling, which is a
  reasonable step once Betfair results hold up.
