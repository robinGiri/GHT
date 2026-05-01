"""
Demo script: load the weather_and_flights data contract and validate a mock DataFrame.

Run (from project root):
    python data_contracts/demo.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure the project root is on sys.path so `data_contracts` is importable
# regardless of how this script is invoked.
_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:  # pragma: no cover
    sys.path.insert(0, str(_project_root))

from datetime import datetime  # noqa: E402

import pandas as pd  # noqa: E402

from data_contracts import load_contract, validate  # noqa: E402


def build_mock_dataframe() -> pd.DataFrame:
    """Build a mock weather_and_flights DataFrame with clean, null, and non-numeric rows."""
    now = datetime.now()

    data = {
        "flight_id": ["F001", "F002", "F003", "F004", "F005"],
        # Row index 2: null flight_status (triggers not_null violation)
        "flight_status": ["on_time", "delayed", None, "on_time", "cancelled"],
        # Row index 3: NaN temperature (triggers is_numeric violation — non-finite/null numeric)
        "temperature": [22.5, 18.0, 30.1, float("nan"), 15.3],
        "departure_airport": ["JFK", "LAX", "ORD", "SFO", "SEA"],
        "arrival_airport":   ["LAX", "JFK", "SFO", "ORD", "LAX"],
        "departure_time": [
            pd.Timestamp("2026-04-29 06:00:00"),
            pd.Timestamp("2026-04-29 08:30:00"),
            pd.Timestamp("2026-04-29 10:00:00"),
            pd.Timestamp("2026-04-29 12:15:00"),
            pd.Timestamp("2026-04-29 14:45:00"),
        ],
    }

    df = pd.DataFrame(data)
    # Ensure temperature stays float (NaN is already float) and departure_time is datetime64
    df["temperature"] = df["temperature"].astype(float)
    df["departure_time"] = pd.to_datetime(df["departure_time"])
    return df


def main() -> None:
    contract_path = "data_contracts/contract.yaml"
    print("=" * 60)
    print("Weather & Flights Data Contract — Validation Demo")
    print("=" * 60)

    # Load the contract
    contract = load_contract(contract_path)
    print(f"\nLoaded contract: '{contract.dataset}'")

    # Build mock data
    df = build_mock_dataframe()
    total_rows = len(df)
    print(f"\nMock DataFrame ({total_rows} rows):")
    print(df.to_string(index=True))

    # Set last_refreshed to now — freshness against 06:00 deadline may or may not trigger
    last_refreshed = datetime.now()

    # Validate
    result = validate(df, contract, last_refreshed)

    # Print summary
    print("\n" + "=" * 60)
    print("Validation Summary")
    print("=" * 60)
    print(f"  Total input rows   : {total_rows}")
    print(f"  Clean count        : {result.clean_count}")
    print(f"  Quarantine count   : {result.quarantine_count}")
    print(f"  Freshness violated : {result.freshness_violation}")

    if result.violation_details:
        print(f"\nViolation details ({len(result.violation_details)} total):")
        for detail in result.violation_details:
            print(f"  - {detail}")
    else:  # pragma: no cover - demo data is engineered to always produce violations
        print("\nNo violation details recorded.")

    print("\nClean records:")
    print(result.clean_records.to_string(index=True) if not result.clean_records.empty else "  (none)")

    print("\nQuarantine records:")
    print(result.quarantine_records.to_string(index=True) if not result.quarantine_records.empty else "  (none)")

    print("\n" + "=" * 60)
    print("Demo complete.")

    # Assertions to guarantee expected output
    assert result.quarantine_count > 0, (
        f"Expected quarantine_count > 0, got {result.quarantine_count}"
    )
    assert len(result.violation_details) >= 2, (
        f"Expected at least 2 violation details, got {len(result.violation_details)}: "
        f"{result.violation_details}"
    )


if __name__ == "__main__":
    main()
