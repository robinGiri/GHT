from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import pandas as pd
from pydantic import BaseModel, Field


class ColumnSchema(BaseModel):
    name: str
    dtype: Literal["string", "float", "integer", "boolean", "datetime"]


class QualityAssertion(BaseModel):
    column: str
    rule: Literal["not_null", "is_numeric"]


class FreshnessSLA(BaseModel):
    schedule: Literal["daily"]
    by_time: str  # HH:MM format, e.g. "06:00"


class DataContract(BaseModel):
    dataset: str
    schema_: list[ColumnSchema] = Field(alias="schema")
    quality_assertions: list[QualityAssertion]
    freshness_sla: FreshnessSLA

    model_config = {"populate_by_name": True}


@dataclass(frozen=True)
class ValidationResult:
    clean_records: pd.DataFrame
    quarantine_records: pd.DataFrame
    freshness_violation: bool
    violation_details: list[str]

    @property
    def clean_count(self) -> int:
        return len(self.clean_records)

    @property
    def quarantine_count(self) -> int:
        return len(self.quarantine_records)
