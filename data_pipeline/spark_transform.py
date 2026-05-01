"""
Himalayan AI — Standalone PySpark Transformation Script
========================================================
Runs the same cleansing & deduplication logic as the Airflow transform task,
but can be executed directly for development and testing.

Run:
    pip install pyspark
    python data_pipeline/spark_transform.py
"""

from __future__ import annotations

import json
import os
import tempfile

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import FloatType, StructType, StructField, StringType


def generate_mock_data(output_dir: str) -> tuple[str, str]:
    """Generate mock flight and review data for testing."""
    import random
    from datetime import datetime, timedelta

    os.makedirs(output_dir, exist_ok=True)

    airports = ["KTM", "LUA", "RHP", "BWA", "PKR"]
    statuses = ["on_time", "delayed", "cancelled", None]

    records = []
    for i in range(50):
        records.append({
            "flight_id": f"HA-{1000 + i}",
            "flight_status": random.choice(statuses),
            "temperature": round(random.uniform(-10, 35), 1) if random.random() > 0.1 else "N/A",
            "departure_airport": random.choice(airports),
            "arrival_airport": random.choice(airports),
            "departure_time": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
        })

    flights_path = os.path.join(output_dir, "weather_and_flights.json")
    with open(flights_path, "w") as f:
        json.dump(records, f, indent=2)

    reviews = [
        "Annapurna Circuit trail is clear and in excellent condition.",
        "Lukla flights were delayed today due to fog.",
        "Manaslu Circuit partially closed near Larke Pass.",
        "Tea houses along EBC trail are open year-round.",
        "Upper Mustang restricted area permit costs USD 500.",
        "Annapurna Circuit trail is clear and in excellent condition.",  # duplicate
        "Lukla flights were delayed today due to fog.",  # duplicate
    ]

    reviews_path = os.path.join(output_dir, "trail_reviews.json")
    with open(reviews_path, "w") as f:
        json.dump(reviews, f, indent=2)

    return flights_path, reviews_path


def transform_flights(spark: SparkSession, input_path: str, output_dir: str):  # pragma: no cover
    """Deduplicate, cleanse, and split flights into clean/quarantine sets."""
    df = spark.read.option("multiLine", True).json(input_path)
    row_count = df.count()
    print(f"  Raw flights: {row_count} rows")

    # Deduplicate on flight_id
    df = df.dropDuplicates(["flight_id"])
    print(f"  After dedup: {df.count()} rows")

    # Coerce temperature to float (invalid strings become null)
    df = df.withColumn("temperature", F.col("temperature").cast(FloatType()))

    # Flag bad rows
    df = df.withColumn(
        "_quarantine",
        F.when(
            F.col("flight_status").isNull() | F.col("temperature").isNull(),
            True,
        ).otherwise(False),
    )

    clean = df.filter(~F.col("_quarantine")).drop("_quarantine")
    quarantine = df.filter(F.col("_quarantine")).drop("_quarantine")

    clean_path = os.path.join(output_dir, "flights_clean")
    quarantine_path = os.path.join(output_dir, "flights_quarantine")

    clean.write.mode("overwrite").json(clean_path)
    quarantine.write.mode("overwrite").json(quarantine_path)

    print(f"  Clean rows: {clean.count()} → {clean_path}")
    print(f"  Quarantine rows: {quarantine.count()} → {quarantine_path}")


def transform_reviews(spark: SparkSession, input_path: str, output_dir: str):  # pragma: no cover
    """Deduplicate trail reviews."""
    with open(input_path) as f:
        reviews = json.load(f)

    df = spark.createDataFrame([(r,) for r in reviews], ["review_text"])
    print(f"  Raw reviews: {df.count()}")

    df = df.dropDuplicates(["review_text"])
    print(f"  Deduped reviews: {df.count()}")

    out_path = os.path.join(output_dir, "trail_reviews_clean")
    df.write.mode("overwrite").json(out_path)
    print(f"  Written → {out_path}")


def validate_with_contract(curated_dir: str) -> None:
    """
    Run the project's data contract over the curated flights output to enforce
    schema, quality, and freshness. Prints a summary; raises on schema failure.
    """
    import glob
    from datetime import datetime as _dt
    from pathlib import Path as _Path
    import pandas as _pd

    # Lazy import so this script works even without the package on path
    import sys as _sys
    _project_root = _Path(__file__).resolve().parent.parent
    if str(_project_root) not in _sys.path:  # pragma: no cover
        _sys.path.insert(0, str(_project_root))
    from data_contracts import load_contract, validate  # type: ignore

    contract_path = _project_root / "data_contracts" / "contract.yaml"
    contract = load_contract(contract_path)

    clean_files = glob.glob(os.path.join(curated_dir, "flights_clean", "*.json"))
    if not clean_files:
        print("  [contract] No curated flight files found — skipping.")
        return

    df = _pd.concat([_pd.read_json(f, lines=True) for f in clean_files], ignore_index=True)
    if "departure_time" in df.columns:
        df["departure_time"] = _pd.to_datetime(df["departure_time"], errors="coerce")

    result = validate(df, contract, last_refreshed=_dt.now())
    print(f"  [contract] clean={result.clean_count} quarantine={result.quarantine_count} "
          f"freshness_violated={result.freshness_violation}")


def main():  # pragma: no cover
    base_dir = os.path.join(tempfile.gettempdir(), "himalayan_ai_spark")
    raw_dir = os.path.join(base_dir, "raw")
    curated_dir = os.path.join(base_dir, "curated")

    print("=== Himalayan AI — PySpark Transformation ===\n")
    print("[1/4] Generating mock data...")
    flights_path, reviews_path = generate_mock_data(raw_dir)

    spark = SparkSession.builder \
        .appName("HimalayanAI_Transform") \
        .master("local[*]") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")

    try:
        print("\n[2/4] Transforming flight data...")
        transform_flights(spark, flights_path, curated_dir)

        print("\n[3/4] Transforming trail reviews...")
        transform_reviews(spark, reviews_path, curated_dir)

        print("\n[4/4] Validating curated flights against data contract...")
        validate_with_contract(curated_dir)

        print(f"\n✅ All transformations complete. Curated data in: {curated_dir}")
    finally:
        spark.stop()


if __name__ == "__main__":
    main()
