"""Build a small synthetic Betfair stream file (same JSON-lines format as Betfair's
historical PRO data) so the backtest can be tested without downloading anything.

One 3-runner WIN market: prices update pre-race, then the market closes with
runner 101 as the winner.
"""
import json

MARKET_ID = "1.900000001"
START = "2026-01-01T15:00:00.000Z"
T0 = 1767279000000  # 2026-01-01T14:50:00Z in ms (10 minutes before the off)


def definition(status="OPEN", inplay=False, winners=None, version=1):
    runners = []
    for i, sel in enumerate((101, 102, 103), start=1):
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
        "runnersVoidable": False, "numberOfActiveRunners": 3, "betDelay": 0,
        "status": status, "runners": runners, "regulators": ["MR_INT"],
        "venue": "Testville", "countryCode": "GB", "discountAllowed": True,
        "timezone": "Europe/London", "openDate": START, "version": version,
        "name": "1m Hcap", "eventName": "Testville 1st Jan",
    }


def lines():
    def mcm(pt, mc):
        return {"op": "mcm", "clk": str(pt), "pt": pt, "mc": mc}

    ladder = lambda back, lay: {"atb": [[back, 50]], "atl": [[lay, 50]]}
    yield mcm(T0, [{"id": MARKET_ID, "marketDefinition": definition(), "img": True, "rc": [
        {"id": 101, **ladder(3.0, 3.1)},   # model says 40% -> fair 2.5, so 3.0 is value
        {"id": 102, **ladder(2.2, 2.26)},  # model says 40% -> fair 2.5, 2.2 is no value
        {"id": 103, **ladder(6.0, 6.4)},   # no model price -> ignored
    ]}])
    # a few ticks inside the betting window (last 300s)
    for k, pt in enumerate(range(T0 + 360_000, T0 + 540_000, 60_000)):
        yield mcm(pt, [{"id": MARKET_ID, "rc": [{"id": 101, "atb": [[3.0, 60 + k]]}]}])
    yield mcm(T0 + 600_000, [{"id": MARKET_ID, "marketDefinition": definition("SUSPENDED", True, version=2)}])
    yield mcm(T0 + 900_000, [{"id": MARKET_ID, "marketDefinition": definition("CLOSED", True, winners={101}, version=3)}])


def write(path):
    with open(path, "w") as fh:
        for line in lines():
            fh.write(json.dumps(line) + "\n")
    return path


FAIR_PRICES = "market_id,selection_id,probability\n" \
              f"{MARKET_ID},101,0.40\n{MARKET_ID},102,0.40\n"
