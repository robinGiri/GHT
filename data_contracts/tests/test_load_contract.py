import tempfile
import os
import pytest
from pathlib import Path
from pydantic import ValidationError
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

def test_load_invalid_structure_raises_validation_error():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
        f.write("dataset: test\n")  # missing schema, quality_assertions, freshness_sla
        tmp_path = f.name
    try:
        with pytest.raises(ValidationError):
            load_contract(tmp_path)
    finally:
        os.unlink(tmp_path)
