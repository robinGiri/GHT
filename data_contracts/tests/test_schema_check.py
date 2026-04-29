import pandas as pd
import pytest
from data_contracts.models import ColumnSchema
from data_contracts.validator import _schema_check


def test_all_columns_present_correct_types():
    schema = [ColumnSchema(name="temp", dtype="float"), ColumnSchema(name="status", dtype="string")]
    df = pd.DataFrame({"temp": [1.0, 2.0], "status": ["ok", "delayed"]})
    violations = _schema_check(df, schema)
    assert violations == []


def test_missing_column_reported():
    schema = [ColumnSchema(name="temp", dtype="float"), ColumnSchema(name="status", dtype="string")]
    df = pd.DataFrame({"temp": [1.0, 2.0]})  # "status" is missing
    violations = _schema_check(df, schema)
    assert len(violations) > 0
    assert any("status" in v for v in violations)


def test_type_mismatch_reported():
    schema = [ColumnSchema(name="temp", dtype="float")]
    df = pd.DataFrame({"temp": ["not_a_float", "also_not"]})  # wrong dtype
    violations = _schema_check(df, schema)
    assert len(violations) > 0
    assert any("temp" in v for v in violations)


def test_multiple_missing_columns_all_reported():
    schema = [ColumnSchema(name="a", dtype="string"), ColumnSchema(name="b", dtype="float"), ColumnSchema(name="c", dtype="integer")]
    df = pd.DataFrame({"a": ["x"]})
    violations = _schema_check(df, schema)
    assert any("b" in v for v in violations)
    assert any("c" in v for v in violations)
