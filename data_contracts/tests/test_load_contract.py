import pytest
from pathlib import Path
from data_contracts.validator import load_contract
from data_contracts.models import DataContract

CONTRACT_PATH = Path("data_contracts/contract.yaml")

def test_load_valid_contract():
    contract = load_contract(CONTRACT_PATH)
    assert isinstance(contract, DataContract)
    assert contract.dataset == "weather_and_flights"
    assert len(contract.schema_) == 6
    assert contract.freshness_sla.by_time == "06:00"

def test_load_missing_file_raises():
    with pytest.raises(FileNotFoundError):
        load_contract("nonexistent/path.yaml")

def test_load_returns_quality_assertions():
    contract = load_contract(CONTRACT_PATH)
    rules = {a.column: a.rule for a in contract.quality_assertions}
    assert rules["flight_status"] == "not_null"
    assert rules["temperature"] == "is_numeric"
