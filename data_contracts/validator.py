from __future__ import annotations

import math
from pathlib import Path
from typing import TYPE_CHECKING

import pandas as pd
import yaml

from .models import ColumnSchema, DataContract, QualityAssertion

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
