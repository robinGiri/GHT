from __future__ import annotations

import math
from datetime import date, datetime
from datetime import time as dt_time
from pathlib import Path
from typing import TYPE_CHECKING

import pandas as pd
import yaml

from .models import ColumnSchema, DataContract, FreshnessSLA, QualityAssertion, ValidationResult

# Type-compatibility map: declared dtype -> pd.api.types checker function
_DTYPE_CHECKERS = {
    "string": lambda col: (
        pd.api.types.is_string_dtype(col) or pd.api.types.is_object_dtype(col)
    ),
    "float": pd.api.types.is_float_dtype,
    "integer": pd.api.types.is_integer_dtype,
    "boolean": pd.api.types.is_bool_dtype,
    "datetime": pd.api.types.is_datetime64_any_dtype,
}


def _schema_check(df: pd.DataFrame, schema: list[ColumnSchema]) -> list[str]:
    """Returns list of violation messages; empty list means pass."""
    violations: list[str] = []
    for col_schema in schema:
        name = col_schema.name
        declared_dtype = col_schema.dtype
        if name not in df.columns:
            violations.append(
                f"Missing column: '{name}' declared as dtype '{declared_dtype}' is not present in the DataFrame."
            )
        else:
            checker = _DTYPE_CHECKERS.get(declared_dtype)
            if checker is not None and not checker(df[name]):
                actual_dtype = str(df[name].dtype)
                violations.append(
                    f"Type mismatch for column '{name}': declared '{declared_dtype}' but found dtype '{actual_dtype}'."
                )
    return violations


def _quality_check(
    df: pd.DataFrame,
    assertions: list[QualityAssertion],
) -> pd.Series:
    """Returns a boolean Series: True = bad record (fails at least one assertion)."""
    bad_mask = pd.Series(False, index=df.index)

    for assertion in assertions:
        col = df[assertion.column]
        if assertion.rule == "not_null":
            assertion_mask = pd.isna(col)
        elif assertion.rule == "is_numeric":
            def _is_bad_numeric(val) -> bool:
                if pd.isna(val):
                    return True
                try:
                    num = float(val)
                except (TypeError, ValueError):
                    return True
                return not math.isfinite(num)

            assertion_mask = col.map(_is_bad_numeric)
        else:
            # Unknown rule — skip
            assertion_mask = pd.Series(False, index=df.index)

        bad_mask = bad_mask | assertion_mask

    return bad_mask


def load_contract(path: str | Path) -> DataContract:
    """
    Reads a YAML contract file and returns a validated DataContract.
    Raises: FileNotFoundError, yaml.YAMLError, pydantic.ValidationError
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Contract file not found: {path}")
    with path.open("r", encoding="utf-8") as fh:
        raw = yaml.safe_load(fh)
    return DataContract.model_validate(raw)


def _freshness_check(
    last_refreshed: datetime,
    sla: FreshnessSLA,
) -> bool:
    """Returns True if freshness SLA is violated.

    The SLA deadline is today at the time specified by ``sla.by_time`` (HH:MM).
    A violation occurs when ``last_refreshed`` is strictly after the deadline,
    meaning the data was not available by the required time.
    """
    hour, minute = map(int, sla.by_time.split(":"))
    deadline = datetime.combine(date.today(), dt_time(hour, minute))
    return last_refreshed > deadline


def validate(
    df: pd.DataFrame,
    contract: DataContract,
    last_refreshed: datetime,
) -> ValidationResult:
    """
    Runs schema, quality, and freshness checks against df.
    Returns a ValidationResult splitting records into clean and quarantine sets.
    Never raises on data failures — failures are captured in violation_details.
    Raises: ValueError if schema check fails (missing columns — row-level split is not possible)
    """
    # Phase 1: Schema check — must pass before row-level splitting is possible
    schema_violations = _schema_check(df, contract.schema_)
    if schema_violations:
        raise ValueError(
            "Schema validation failed; row-level split is not possible:\n"
            + "\n".join(schema_violations)
        )

    violation_details: list[str] = []

    # Phase 2: Quality check — get bad-record mask and build violation messages
    bad_mask = _quality_check(df, contract.quality_assertions)

    for idx in df.index[bad_mask]:
        row = df.loc[idx]
        row_messages: list[str] = []
        for assertion in contract.quality_assertions:
            col_val = row[assertion.column]
            if assertion.rule == "not_null":
                if pd.isna(col_val):
                    row_messages.append(
                        f"Row {idx}: {assertion.column} is null"
                    )
            elif assertion.rule == "is_numeric":
                is_bad = False
                if pd.isna(col_val):
                    is_bad = True
                else:
                    try:
                        num = float(col_val)
                        is_bad = not math.isfinite(num)
                    except (TypeError, ValueError):
                        is_bad = True
                if is_bad:
                    row_messages.append(
                        f"Row {idx}: {assertion.column} is not a finite numeric value"
                    )
        violation_details.extend(row_messages)

    clean_records = df[~bad_mask].reset_index(drop=True)
    quarantine_records = df[bad_mask].reset_index(drop=True)

    # Phase 3: Freshness check
    freshness_violated = _freshness_check(last_refreshed, contract.freshness_sla)
    if freshness_violated:
        violation_details.append(
            f"Freshness SLA violated: data was last refreshed at {last_refreshed.isoformat()}, "
            f"which is after the required deadline of {contract.freshness_sla.by_time}."
        )

    return ValidationResult(
        clean_records=clean_records,
        quarantine_records=quarantine_records,
        freshness_violation=freshness_violated,
        violation_details=violation_details,
    )
