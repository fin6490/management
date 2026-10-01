import pytest

from bot.fair_prices import CsvFairPrices


def test_reads_probabilities(tmp_path):
    f = tmp_path / "p.csv"
    f.write_text("market_id,selection_id,probability\n1.2,101,0.25\n")
    prices = CsvFairPrices(str(f))
    assert prices.get("1.2", 101) == 0.25 and prices.get("1.2", 999) is None


def test_missing_file_is_empty(tmp_path):
    assert len(CsvFairPrices(str(tmp_path / "nope.csv"))) == 0


def test_rejects_bad_probability(tmp_path):
    f = tmp_path / "p.csv"
    f.write_text("market_id,selection_id,probability\n1.2,101,40\n")
    with pytest.raises(ValueError):
        CsvFairPrices(str(f))
