"""What a progression does on an exchange, before risking anything.

    python simulate_progression.py progressions/11pct_hunter.json
    python simulate_progression.py progressions/11pct_hunter.json --commission 0.02

By default the runner's true chance is the fair chance implied by the target odds
(1 / odds), i.e. no edge: the market is priced correctly and you pay commission.
Use --edge to see what a genuinely better-than-market selection would need.
"""
import argparse

from bot.progression import ProgressionConfig, monte_carlo


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("config")
    ap.add_argument("--commission", type=float, default=0.05)
    ap.add_argument("--edge", type=float, default=0.0,
                    help="extra true win chance vs the price, e.g. 0.01 = +1 percentage point")
    ap.add_argument("--min-stake", type=float, default=1.0)
    ap.add_argument("--sessions", type=int, default=20_000)
    ap.add_argument("--seed", type=int)
    args = ap.parse_args(argv)

    cfg = ProgressionConfig.load(args.config)
    price = cfg.target_odds
    p = 1 / price + args.edge
    r = monte_carlo(cfg, win_prob=p, price=price, commission=args.commission,
                    min_stake=args.min_stake, sessions=args.sessions, seed=args.seed)
    print(f"{cfg.name}: odds {price}, true chance {p:.2%}, commission {args.commission:.0%}, "
          f"bankroll {cfg.bankroll}, base {cfg.base}, target {cfg.stop_balance_above}")
    print(f"  Expected value per bet : {r['ev_per_bet_pct']:+.2f}% of stake")
    print(f"  Sessions in profit     : {r['profit_rate']:.1%}")
    print(f"  Sessions bust          : {r['bust_rate']:.1%}")
    print(f"  Average result         : {r['avg_result']:+.2f} per session")
    print(f"  Average bets           : {r['avg_bets']:.0f} per session")
    print(f"  Bad / typical / good   : {r['p10']:+.2f} / {r['median']:+.2f} / {r['p90']:+.2f}")
    return r


if __name__ == "__main__":
    main()
