"""
Himalayan AI — Airflow DAG for the ELT Pipeline
=================================================
DAG: himalayan_ai_elt

Tasks (sequential):
  1. extract_data    — generate mock structured + unstructured data
  2. load_raw_data   — load raw data into the warehouse (simulates Snowflake/Databricks)
  3. transform_data  — run PySpark cleansing & deduplication

Run locally:
    pip install apache-airflow pyspark pandas
    airflow db init
    cp data_pipeline/elt_dag.py ~/airflow/dags/
    airflow dags test himalayan_ai_elt 2024-01-01
"""

from __future__ import annotations

import json
import os
import random
import tempfile
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RAW_DATA_DIR = os.path.join(tempfile.gettempdir(), "himalayan_ai", "raw")
WAREHOUSE_DIR = os.path.join(tempfile.gettempdir(), "himalayan_ai", "warehouse")

AIRPORTS = ["KTM", "LUA", "RHP", "BWA", "PKR"]
STATUSES = ["on_time", "delayed", "cancelled", None]  # None simulates bad data

TRAIL_REVIEWS = [
    "Annapurna Circuit trail is clear and in excellent condition.",
    "Lukla flights were delayed today due to fog.",
    "Manaslu Circuit partially closed near Larke Pass — heavy snowfall.",
    "Tea houses along EBC trail are open year-round.",
    "Upper Mustang restricted area permit costs USD 500 for 10 days.",
    "Weather was perfect on Thorong La — clear skies at 5,416 m.",
    "Leeches below 2,500 m during monsoon are unbearable!",
    "Helicopter rescue from Namche took only 25 minutes.",
    "Annapurna Circuit trail is clear and in excellent condition.",  # duplicate
    "Lukla flights were delayed today due to fog.",  # duplicate
]

# ---------------------------------------------------------------------------
# Task 1: Extract — generate mock structured + unstructured data
# ---------------------------------------------------------------------------

def extract_data(**context):
    """Generate mock weather/flight logs (structured) and trail reviews (unstructured)."""
    os.makedirs(RAW_DATA_DIR, exist_ok=True)

    # Structured: weather & flight logs
    records = []
    for i in range(50):
        records.append({
            "flight_id": f"HA-{1000 + i}",
            "flight_status": random.choice(STATUSES),
            "temperature": round(random.uniform(-10, 35), 1) if random.random() > 0.1 else "N/A",
            "departure_airport": random.choice(AIRPORTS),
            "arrival_airport": random.choice(AIRPORTS),
            "departure_time": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
        })

    flights_path = os.path.join(RAW_DATA_DIR, "weather_and_flights.json")
    with open(flights_path, "w") as f:
        json.dump(records, f, indent=2)
    print(f"[Extract] Wrote {len(records)} flight records → {flights_path}")

    # Unstructured: trail reviews (includes intentional duplicates)
    reviews_path = os.path.join(RAW_DATA_DIR, "trail_reviews.json")
    with open(reviews_path, "w") as f:
        json.dump(TRAIL_REVIEWS, f, indent=2)
    print(f"[Extract] Wrote {len(TRAIL_REVIEWS)} trail reviews → {reviews_path}")

    # Push paths via XCom so downstream tasks can locate files
    context["ti"].xcom_push(key="flights_path", value=flights_path)
    context["ti"].xcom_push(key="reviews_path", value=reviews_path)


# ---------------------------------------------------------------------------
# Task 2: Load — raw data into the warehouse (ELT: load *before* transform)
# ---------------------------------------------------------------------------

def load_raw_data(**context):
    """Simulate loading raw data into a Snowflake/Databricks staging area."""
    ti = context["ti"]
    flights_path = ti.xcom_pull(task_ids="extract_data", key="flights_path")
    reviews_path = ti.xcom_pull(task_ids="extract_data", key="reviews_path")

    staging_dir = os.path.join(WAREHOUSE_DIR, "staging")
    os.makedirs(staging_dir, exist_ok=True)

    # Copy raw files into warehouse staging
    import shutil
    staged_flights = os.path.join(staging_dir, "weather_and_flights.json")
    staged_reviews = os.path.join(staging_dir, "trail_reviews.json")

    shutil.copy2(flights_path, staged_flights)
    shutil.copy2(reviews_path, staged_reviews)

    print(f"[Load] Staged flights → {staged_flights}")
    print(f"[Load] Staged reviews → {staged_reviews}")

    ti.xcom_push(key="staged_flights", value=staged_flights)
    ti.xcom_push(key="staged_reviews", value=staged_reviews)


# ---------------------------------------------------------------------------
# Task 3: Transform — PySpark cleansing & deduplication
# ---------------------------------------------------------------------------

def transform_data(**context):
    """Run PySpark transformations: deduplication, null handling, type coercion."""
    from pyspark.sql import SparkSession
    from pyspark.sql import functions as F
    from pyspark.sql.types import FloatType

    ti = context["ti"]
    staged_flights = ti.xcom_pull(task_ids="load_raw_data", key="staged_flights")
    staged_reviews = ti.xcom_pull(task_ids="load_raw_data", key="staged_reviews")

    spark = SparkSession.builder \
        .appName("HimalayanAI_ELT_Transform") \
        .master("local[*]") \
        .getOrCreate()

    try:
        # --- Structured data: weather & flights ---
        flights_df = spark.read.option("multiLine", True).json(staged_flights)
        print(f"[Transform] Raw flights: {flights_df.count()} rows")

        # Deduplicate on flight_id
        flights_deduped = flights_df.dropDuplicates(["flight_id"])
        print(f"[Transform] After dedup: {flights_deduped.count()} rows")

        # Coerce temperature to float (invalid strings → null)
        flights_clean = flights_deduped.withColumn(
            "temperature",
            F.col("temperature").cast(FloatType()),
        )

        # Flag rows with null flight_status or null temperature as quarantine
        flights_clean = flights_clean.withColumn(
            "_quarantine",
            F.when(
                F.col("flight_status").isNull() | F.col("temperature").isNull(),
                True,
            ).otherwise(False),
        )

        clean_count = flights_clean.filter(~F.col("_quarantine")).count()
        quarantine_count = flights_clean.filter(F.col("_quarantine")).count()
        print(f"[Transform] Clean: {clean_count}, Quarantine: {quarantine_count}")

        # Write to warehouse curated layer
        curated_dir = os.path.join(WAREHOUSE_DIR, "curated")
        os.makedirs(curated_dir, exist_ok=True)

        flights_clean.filter(~F.col("_quarantine")).drop("_quarantine") \
            .write.mode("overwrite").json(os.path.join(curated_dir, "flights_clean"))
        flights_clean.filter(F.col("_quarantine")).drop("_quarantine") \
            .write.mode("overwrite").json(os.path.join(curated_dir, "flights_quarantine"))

        # --- Unstructured data: trail reviews ---
        import json as _json
        with open(staged_reviews) as f:
            reviews = _json.load(f)

        reviews_df = spark.createDataFrame(
            [(r,) for r in reviews], ["review_text"]
        )
        print(f"[Transform] Raw reviews: {reviews_df.count()}")

        reviews_deduped = reviews_df.dropDuplicates(["review_text"])
        print(f"[Transform] Deduped reviews: {reviews_deduped.count()}")

        reviews_deduped.write.mode("overwrite").json(
            os.path.join(curated_dir, "trail_reviews_clean")
        )

        print(f"[Transform] Curated data written to {curated_dir}")
    finally:
        spark.stop()


# ---------------------------------------------------------------------------
# DAG Definition
# ---------------------------------------------------------------------------
default_args = {
    "owner": "himalayan_ai",
    "depends_on_past": False,
    "email_on_failure": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="himalayan_ai_elt",
    default_args=default_args,
    description="Himalayan AI — Extract, Load, Transform pipeline for weather, flights & trail data",
    schedule_interval="@daily",
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["himalayan_ai", "elt", "spark"],
) as dag:

    t_extract = PythonOperator(
        task_id="extract_data",
        python_callable=extract_data,
    )

    t_load = PythonOperator(
        task_id="load_raw_data",
        python_callable=load_raw_data,
    )

    t_transform = PythonOperator(
        task_id="transform_data",
        python_callable=transform_data,
    )

    # Sequential dependency: Extract → Load → Transform
    t_extract >> t_load >> t_transform
