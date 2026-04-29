from __future__ import annotations

from pathlib import Path

import yaml

from .models import DataContract


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
