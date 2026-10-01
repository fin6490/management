"""Summarise settled markets from a strategy run."""


def summarise(results: list) -> dict:
    staked = sum(r["staked"] for r in results)
    net = sum(r["net"] for r in results)
    return {
        "markets": len(results),
        "bets": sum(r["bets"] for r in results),
        "matched_bets": sum(r["matched"] for r in results),
        "staked": round(staked, 2),
        "commission": round(sum(r["commission"] for r in results), 2),
        "net_pnl": round(net, 2),
        "roi_pct": round(100 * net / staked, 2) if staked else 0.0,
        "winning_markets": sum(1 for r in results if r["net"] > 0),
    }


def format_summary(s: dict) -> str:
    return (
        f"Markets settled : {s['markets']}\n"
        f"Bets placed     : {s['bets']} ({s['matched_bets']} matched)\n"
        f"Total staked    : {s['staked']:.2f}\n"
        f"Commission      : {s['commission']:.2f}\n"
        f"Net P/L         : {s['net_pnl']:+.2f}\n"
        f"ROI             : {s['roi_pct']:+.2f}%\n"
        f"Winning markets : {s['winning_markets']} of {s['markets']}"
    )
