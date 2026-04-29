from datetime import datetime, date, time
import pandas as pd
import pytest
from data_contracts.validator import load_contract, validate
from pathlib import Path

CONTRACT_PATH = Path("data_contracts/contract.yaml")

def _today_at(hour):
    return datetime.combine(date.today(), time(hour, 0))

def _make_df(**kwargs):
    base = {
        "flight_id": ["F001", "F002", "F003"],
        "flight_status": ["on_time", "delayed", "cancelled"],
        "temperature": [22.5, 18.0, -5.1],
        "departure_airport": ["JFK", "LAX", "ORD"],
        "arrival_airport": ["LAX", "JFK", "DFW"],
        "departure_time": pd.to_datetime(["2024-01-01", "2024-01-02", "2024-01-03"]),
    }
    base.update(kwargs)
    return pd.DataFrame(base)

def test_all_clean_fresh_data():
    contract = load_contract(CONTRACT_PATH)
    df = _make_df()
    result = validate(df, contract, _today_at(5))  # refreshed at 05:00, SLA 06:00 → fresh
    assert result.quarantine_count == 0
    assert result.clean_count == 3
    assert result.freshness_violation is False

def test_mixed_df_correct_split():
    contract = load_contract(CONTRACT_PATH)
    df = _make_df(
        flight_status=["on_time", None, "cancelled"],  # row 1 fails not_null
        temperature=[22.5, 18.0, float("inf")],        # row 2 fails is_numeric
    )
    result = validate(df, contract, _today_at(5))
    assert result.quarantine_count == 2
    assert result.clean_count == 1
    assert len(result.violation_details) > 0

def test_schema_failure_raises_value_error():
    contract = load_contract(CONTRACT_PATH)
    df = pd.DataFrame({"flight_id": ["F001"]})  # missing most columns
    with pytest.raises(ValueError):
        validate(df, contract, _today_at(5))

def test_stale_data_freshness_violation():
    contract = load_contract(CONTRACT_PATH)
    df = _make_df()
    result = validate(df, contract, _today_at(7))  # refreshed at 07:00, SLA 06:00 → violation
    assert result.freshness_violation is True
    assert result.quarantine_count == 0  # data itself is clean

def test_all_pass_quarantine_empty():
    contract = load_contract(CONTRACT_PATH)
    df = _make_df()
    result = validate(df, contract, _today_at(5))
    assert result.quarantine_count == 0

def test_violation_details_populated_for_bad_records():
    contract = load_contract(CONTRACT_PATH)
    df = _make_df(flight_status=["on_time", None, "cancelled"])
    result = validate(df, contract, _today_at(5))
    assert len(result.violation_details) > 0
