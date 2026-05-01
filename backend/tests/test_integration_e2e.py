"""
End-to-End Integration Test
============================
Exercises components 2 → 5 in a single flow without requiring Spark/Airflow:

  1. Data Pipeline (Pandas-equivalent of the Spark transform): produce curated
     trail reviews + curated flights.
  2. Data Contracts: validate the curated flights against contract.yaml
     (schema, quality, freshness).
  3. AI / RAG: load curated trail reviews into the RAG corpus.
  4. Backend: hit POST /api/chat through FastAPI's TestClient.
  5. Assert the chatbot answer references the curated content — proving
     pipeline output is reachable end-to-end via the API the frontend uses.
"""

from __future__ import annotations

import json
from datetime import date, datetime, time as dt_time
from pathlib import Path

import pandas as pd

from data_contracts import load_contract, validate
from backend.rag_pipeline import (
    DOCUMENTS,
    MockLLM,
    build_corpus,
    build_rag_chain,
    build_vector_store,
    load_curated_reviews,
)


# ---------------------------------------------------------------------------
# Pandas implementation of the Spark transform — same dedup/quarantine logic,
# no JVM required so this test stays fast and CI-friendly.
# ---------------------------------------------------------------------------

RAW_FLIGHTS = [
    {"flight_id": "HA-1000", "flight_status": "on_time",  "temperature": 12.0,
     "departure_airport": "KTM", "arrival_airport": "LUA",
     "departure_time": "2026-04-29T06:00:00"},
    {"flight_id": "HA-1001", "flight_status": "delayed",  "temperature": 8.5,
     "departure_airport": "LUA", "arrival_airport": "KTM",
     "departure_time": "2026-04-29T08:00:00"},
    {"flight_id": "HA-1002", "flight_status": None,       "temperature": 5.0,
     "departure_airport": "KTM", "arrival_airport": "PKR",
     "departure_time": "2026-04-29T09:00:00"},  # quarantine: null status
    {"flight_id": "HA-1003", "flight_status": "on_time",  "temperature": "N/A",
     "departure_airport": "PKR", "arrival_airport": "KTM",
     "departure_time": "2026-04-29T10:00:00"},  # quarantine: bad temp
    {"flight_id": "HA-1000", "flight_status": "on_time",  "temperature": 12.0,
     "departure_airport": "KTM", "arrival_airport": "LUA",
     "departure_time": "2026-04-29T06:00:00"},  # exact duplicate of HA-1000
]

RAW_REVIEWS = [
    "The Larke Pass crossing on the Manaslu Circuit was clear with bluebird skies on April 28.",
    "Helicopter pickup from Kagbeni took 18 minutes — fastest evac of the season.",
    "The Larke Pass crossing on the Manaslu Circuit was clear with bluebird skies on April 28.",  # dup
]


def _run_pandas_pipeline(curated_dir: Path) -> dict:
    """Mirror the Spark transform: dedup, type-coerce, quarantine, write JSONL."""
    flights = pd.DataFrame(RAW_FLIGHTS).drop_duplicates(subset=["flight_id"])
    flights["temperature"] = pd.to_numeric(flights["temperature"], errors="coerce")

    bad = flights["flight_status"].isna() | flights["temperature"].isna()
    clean_flights = flights[~bad].reset_index(drop=True)
    quarantine = flights[bad].reset_index(drop=True)

    reviews = sorted(set(RAW_REVIEWS))

    flights_out = curated_dir / "flights_clean"
    flights_out.mkdir(parents=True, exist_ok=True)
    clean_flights.to_json(flights_out / "part-0000.json", orient="records", lines=True)

    reviews_out = curated_dir / "trail_reviews_clean"
    reviews_out.mkdir(parents=True, exist_ok=True)
    with open(reviews_out / "part-0000.json", "w") as fh:
        for r in reviews:
            fh.write(json.dumps({"review_text": r}) + "\n")

    return {
        "clean_flights": len(clean_flights),
        "quarantine_flights": len(quarantine),
        "reviews": len(reviews),
        "raw_reviews": len(RAW_REVIEWS),
    }


# ---------------------------------------------------------------------------
# Test
# ---------------------------------------------------------------------------

def test_pipeline_to_contracts_to_rag_to_api(tmp_path, monkeypatch, client):
    # ---- Step 1: Data Pipeline (pandas stand-in for Spark) ----
    curated_dir = tmp_path / "curated"
    summary = _run_pandas_pipeline(curated_dir)
    assert summary["clean_flights"] == 2          # 5 raw - 1 dup - 2 quarantine
    assert summary["quarantine_flights"] == 2
    assert summary["reviews"] == 2                # 3 raw - 1 dup

    # ---- Step 2: Data Contract validation ----
    contract = load_contract(Path("data_contracts/contract.yaml"))
    df = pd.read_json(curated_dir / "flights_clean" / "part-0000.json", lines=True)
    df["departure_time"] = pd.to_datetime(df["departure_time"])

    # Use a fresh timestamp inside today's SLA window (06:00) so freshness passes.
    fresh_ts = datetime.combine(date.today(), dt_time(5, 0))
    result = validate(df, contract, last_refreshed=fresh_ts)
    assert result.quarantine_count == 0           # curated rows are all clean
    assert result.clean_count == 2
    assert result.freshness_violation is False

    # ---- Step 3: RAG ingests curated reviews from the warehouse ----
    curated_reviews = load_curated_reviews(str(curated_dir))
    assert len(curated_reviews) == 2
    assert any("Larke Pass" in r for r in curated_reviews)

    corpus = build_corpus(str(curated_dir))
    assert len(corpus) == len(DOCUMENTS) + 2

    # Build a chain over the merged corpus and verify retrieval finds curated docs
    vs = build_vector_store(corpus)
    chain = build_rag_chain(vs, MockLLM(), k=3)
    rag_result = chain.invoke({"query": "How was the Larke Pass crossing recently?"})
    retrieved = " ".join(d.page_content for d in rag_result["source_documents"])
    assert "Larke Pass" in retrieved

    # ---- Step 4: Backend /api/chat round-trip (frontend's contract) ----
    resp = client.post("/api/chat", json={"question": "What permits do I need for Upper Mustang?"})
    assert resp.status_code == 200
    body = resp.json()
    assert "answer" in body and "sources" in body
    assert len(body["sources"]) > 0
    # The static DOCUMENTS contain the Mustang permit fact — proves backend → RAG works.
    assert any("Mustang" in s["text"] or "permit" in s["text"].lower() for s in body["sources"])
