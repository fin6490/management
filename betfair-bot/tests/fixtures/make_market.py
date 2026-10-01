"""Build a small synthetic Betfair stream file (same JSON-lines format as Betfair's
historical PRO data) so the backtest can be tested without downloading anything.

One 3-runner WIN market: prices update pre-race, then the market closes with
runner 101 as the winner.
"""
import json

MARKET_ID = "1.900000001"
START = "2026-01-01T15:00:00.000Z"
T0 = 1767279000000  # 2026-01-01T14:50:00Z in ms (10 minutes before the off)


def definition(status="OPEN", inplay=False, winners=None, version=1, selections=(101, 102, 103)):
    runners = []
    for i, sel in enumerate(selections, start=1):
        r = {"status": "ACTIVE", "sortPriority": i, "id": sel}
        if winners is not None:
            r["status"] = "WINNER" if sel in winners else "LOSER"
        runners.append(r)
    return {
        "bspMarket": False, "turnInPlayEnabled": True, "persistenceEnabled": True,
        "marketBaseRate": 5.0, "eventId": "31000001", "eventTypeId": "7",
        "numberOfWinners": 1, "bettingType": "ODDS", "marketType": "WIN",
        "marketTime": START, "suspendTime": START, "bspReconciled": False,
        "complete": True, "inPlay": inplay, "crossMatching": True,
        "runnersVoidable": False, "numberOfActiveRunners": len(selections), "betDelay": 0,
        "status": status, "runners": runners, "regulators": ["MR_INT"],
        "venue": "Testville", "countryCode": "GB", "discountAllowed": True,
        "timezone": "Europe/London", "openDate": START, "version": version,
        "name": "1m Hcap", "eventName": "Testville 1st Jan",
    }


def lines(market_id=MARKET_ID, prices=None, winner=101, t0=T0):
    """prices: {selection_id: best back price}. Defaults to the value-strategy scenario."""
    prices = prices or {101: 3.0, 102: 2.2, 103: 6.0}
    sels = tuple(prices)
    start = t0 + 600_000

    def mcm(pt, mc):
        return {"op": "mcm", "clk": str(pt), "pt": pt, "mc": mc}

    def defn(**kw):
        d = definition(selections=sels, **kw)
        iso = _iso(start)
        d.update(marketTime=iso, suspendTime=iso, openDate=iso)
        return d

    rc = [{"id": sel, "atb": [[price, 50]], "atl": [[round(price * 1.05, 2), 50]]}
          for sel, price in prices.items()]
    yield mcm(t0, [{"id": market_id, "marketDefinition": defn(), "img": True, "rc": rc}])
    # a few ticks inside the betting window (last 300s)
    first = sels[0]
    for k, pt in enumerate(range(t0 + 360_000, t0 + 540_000, 60_000)):
        yield mcm(pt, [{"id": market_id, "rc": [{"id": first, "atb": [[prices[first], 60 + k]]}]}])
    yield mcm(t0 + 600_000, [{"id": market_id, "marketDefinition": defn(status="SUSPENDED", inplay=True, version=2)}])
    yield mcm(t0 + 900_000, [{"id": market_id, "marketDefinition": defn(status="CLOSED", inplay=True, winners={winner}, version=3)}])


def _iso(ms):
    import datetime
    return datetime.datetime.fromtimestamp(ms / 1000, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def write(path, **kw):
    with open(path, "w") as fh:
        for line in lines(**kw):
            fh.write(json.dumps(line) + "\n")
    return path


FAIR_PRICES = "market_id,selection_id,probability\n" \
              f"{MARKET_ID},101,0.40\n{MARKET_ID},102,0.40\n"
