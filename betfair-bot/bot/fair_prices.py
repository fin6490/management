"""Where your edge comes from: your model's win probability for each runner.

The bot only bets when a runner has a price here AND the exchange offers better
odds than that probability implies (after commission). Replace `CsvFairPrices`
with your own model class; it just needs a `get(market_id, selection_id)` method.
"""
import csv
import os
from typing import Dict, Optional, Tuple


class CsvFairPrices:
    """Reads `market_id,selection_id,probability` rows (probability in 0-1)."""

    def __init__(self, path: str):
        self.path = path
        self._prices: Dict[Tuple[str, int], float] = {}
        if os.path.exists(path):
            self.reload()

    def reload(self) -> None:
        prices = {}
        with open(self.path, newline="") as fh:
            for row in csv.DictReader(fh):
                p = float(row["probability"])
                if not 0.0 < p < 1.0:
                    raise ValueError(f"probability must be between 0 and 1, got {p} in {row}")
                prices[(row["market_id"].strip(), int(row["selection_id"]))] = p
        self._prices = prices

    def get(self, market_id: str, selection_id: int) -> Optional[float]:
        return self._prices.get((market_id, int(selection_id)))

    def __len__(self) -> int:
        return len(self._prices)
