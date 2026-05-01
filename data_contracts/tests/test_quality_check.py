import pandas as pd
from data_contracts.models import QualityAssertion
from data_contracts.validator import _quality_check

def test_all_clean_rows():
    assertions = [
        QualityAssertion(column="flight_status", rule="not_null"),
        QualityAssertion(column="temperature", rule="is_numeric"),
    ]
    df = pd.DataFrame({
        "flight_status": ["on_time", "delayed", "cancelled"],
        "temperature": [22.5, 18.0, -5.1],
    })
    mask = _quality_check(df, assertions)
    assert mask.sum() == 0  # no bad rows

def test_null_flight_status_flagged():
    assertions = [QualityAssertion(column="flight_status", rule="not_null")]
    df = pd.DataFrame({"flight_status": ["ok", None, "ok"]})
    mask = _quality_check(df, assertions)
    assert mask.sum() == 1
    assert mask.iloc[1] is True or bool(mask.iloc[1])  # noqa: E712

def test_non_numeric_temperature_flagged():
    assertions = [QualityAssertion(column="temperature", rule="is_numeric")]
    df = pd.DataFrame({"temperature": [22.5, "not_a_number", None]})
    mask = _quality_check(df, assertions)
    assert mask.sum() == 2  # both "not_a_number" and None are bad

def test_infinite_temperature_flagged():
    assertions = [QualityAssertion(column="temperature", rule="is_numeric")]
    df = pd.DataFrame({"temperature": [1.0, float("inf"), float("-inf")]})
    mask = _quality_check(df, assertions)
    assert mask.sum() == 2  # both infinities flagged

def test_mixed_violations_correct_count():
    assertions = [
        QualityAssertion(column="flight_status", rule="not_null"),
        QualityAssertion(column="temperature", rule="is_numeric"),
    ]
    df = pd.DataFrame({
        "flight_status": ["ok", None, "ok", "ok"],  # row 1 fails
        "temperature": [22.5, 18.0, float("inf"), -5.1],  # row 2 fails
    })
    mask = _quality_check(df, assertions)
    assert mask.sum() == 2
    assert bool(mask.iloc[1])  # null flight_status
    assert bool(mask.iloc[2])  # infinite temperature
