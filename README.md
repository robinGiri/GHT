# Great Himalaya Trail (GHT) — Full-Stack AI & Data Engineering Platform

An end-to-end application combining an **e-commerce shop** for Himalayan trail maps/books, a **RAG-powered AI chatbot**, a **data engineering pipeline**, and a **data contracts framework** — all themed around Nepal's Great Himalaya Trail.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Vite)                        │
│  Pages: Home, Journeys, Plan, Culture, Shop, Admin Dashboard        │
│  Components: CartDrawer, ChatWidget, MapProductCard, BookCard        │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ REST API
┌────────────────────────────────────▼────────────────────────────────┐
│                     Backend (FastAPI + SQLAlchemy)                    │
│  Routes: /api/products, /api/checkout, /api/chat, /api/admin        │
│  Models: Product, Order, OrderItem                                   │
│  Integrations: Stripe Payments, SMTP Email, RAG Chatbot             │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────┐
│                     AI / RAG Pipeline (LangChain)                     │
│  Embeddings: sentence-transformers/all-MiniLM-L6-v2                  │
│  Vector Store: FAISS (in-memory)                                     │
│  LLM: MockLLM (pluggable for OpenAI/Ollama)                         │
│  Knowledge: Trail conditions, permits, logistics, weather, health    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   Data Engineering Pipeline (Airflow + PySpark)       │
│  ELT DAG: Extract → Load → Transform                                │
│  Structured: weather/flight logs (dedup, type coercion, quarantine)  │
│  Unstructured: trail reviews (deduplication)                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   Data Contracts (Pydantic + Pandas)                  │
│  YAML contract → Schema check → Quality assertions → Freshness SLA  │
│  Output: clean records + quarantine records + violation details       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   Reverse ETL (Push to CRM)                          │
│  Reads cleaned leads from warehouse → pushes to mock CRM API         │
│  Personalised trek recommendations for sales teams                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Frontend (`src/`)
- **React + Vite** single-page application
- Pages: Homepage, Journeys (trek routes), Plan (logistics), Culture, Shop (maps & books)
- E-commerce: cart, Stripe checkout, order success/cancel flows
- Admin panel: dashboard, products CRUD, orders, fulfillment, inventory
- AI chatbot widget for trail/logistics questions

### 2. Backend (`backend/`)
- **FastAPI** REST API with SQLAlchemy ORM (SQLite dev / Postgres prod)
- Products: digital maps, physical books, donations, bundles
- Checkout: Stripe payment sessions with webhook handling
- Admin: CRUD, order management, revenue dashboard, inventory alerts
- Secure downloads: HMAC-SHA256 time-limited tokens
- Rate limiting via slowapi

### 3. AI / RAG Chatbot (`backend/rag_pipeline.py`)
- **LangChain** RetrievalQA chain
- Knowledge base: 20 documents covering flights, trails, permits, accommodation, weather, health
- **Embeddings**: HuggingFace `all-MiniLM-L6-v2` (local, no API key needed)
- **Vector store**: FAISS in-memory index
- **LLM**: MockLLM (formats retrieved context into answers; pluggable for OpenAI/Ollama)
- Endpoint: `POST /api/chat` with rate limiting

### 4. Data Engineering Pipeline (`data_pipeline/`)
- **Apache Airflow DAG** (`himalayan_ai_elt`) with 3 sequential tasks:
  1. **Extract**: Generate mock structured (weather/flight logs) + unstructured (trail reviews) data
  2. **Load**: Stage raw data into warehouse (simulates Snowflake/Databricks)
  3. **Transform**: PySpark cleansing — deduplication, type coercion, null handling, quarantine flagging
- **Standalone PySpark script** for development/testing without Airflow

### 5. Data Contracts (`data_contracts/`)
- YAML-defined contracts with schema, quality assertions, and freshness SLAs
- **Schema check**: column presence + dtype validation
- **Quality check**: `not_null`, `is_numeric` rules → row-level clean/quarantine split
- **Freshness check**: daily SLA violation detection
- Pydantic models for contract definitions
- Comprehensive test suite (schema, quality, freshness, public API)

### 6. Reverse ETL (`reverse_etl/`)
- Reads cleaned customer-lead data from the data warehouse
- Pushes enriched trekking leads to a mock CRM (Salesforce/HubSpot style)
- Lead scoring and filtering before sync
- Enables personalised trek recommendations for sales teams

---

## End-to-End Integration

Components 1–5 are wired together so a single user question in the browser can be answered with data that flowed all the way through the pipeline. Below is exactly how each hand-off is implemented.

### Data flow

```
[Data Pipeline]   PySpark transform → curated/ (flights_clean, trail_reviews_clean)
       │            data_pipeline/spark_transform.py
       ▼
[Data Contracts]  validate_with_contract() loads contract.yaml and runs
                  schema + quality + freshness checks over curated flights
       │            data_contracts/validator.py :: validate()
       ▼
[RAG]             build_corpus(curated_dir) reads trail_reviews_clean and
                  merges it with the static DOCUMENTS list before indexing
       │            backend/rag_pipeline.py :: load_curated_reviews / build_corpus
       ▼
[Backend API]     POST /api/chat invokes the RetrievalQA chain
       │            backend/routes/chat.py
       ▼
[Frontend]        ChatWidget posts the user's question to /api/chat
                    src/components/ChatWidget.jsx
```

### Wiring details

#### 1. Pipeline → Data Contracts
[`data_pipeline/spark_transform.py`](data_pipeline/spark_transform.py) added a `validate_with_contract(curated_dir)` step that runs after the Spark transform finishes:

- Reads `curated/flights_clean/*.json` (JSON Lines written by Spark) into a Pandas DataFrame.
- Loads the YAML contract via `data_contracts.load_contract("data_contracts/contract.yaml")`.
- Calls `data_contracts.validate(df, contract, last_refreshed=now)` — schema, quality, and freshness assertions run together; failed rows go to a quarantine set, and freshness violations are reported.
- Prints `clean=N quarantine=N freshness_violated=bool` so the pipeline (and Airflow logs) record contract status.

#### 2. Data Pipeline → RAG
[`backend/rag_pipeline.py`](backend/rag_pipeline.py) gained two helpers that let the chatbot consume the warehouse's curated unstructured data:

- `load_curated_reviews(curated_dir)` — walks `curated/trail_reviews_clean/*.json`, parses each JSON Lines record, and returns a list of `review_text` strings. Returns `[]` when the directory does not exist, so the RAG service still boots without a pipeline run.
- `build_corpus(curated_dir=None)` — concatenates the static `DOCUMENTS` knowledge base with `load_curated_reviews(curated_dir)`. Callers pass this list to `build_vector_store()` so FAISS indexes both static facts and freshly-validated trail reports.

#### 3. RAG → Backend API
[`backend/routes/chat.py`](backend/routes/chat.py) builds the vector store and `RetrievalQA` chain at module load and exposes them via `POST /api/chat`. Request: `{ "question": str }`. Response: `{ "answer": str, "sources": [{ "text": str }, ...] }`. Rate-limited to 10/min via slowapi.

#### 4. Backend API → Frontend
[`src/components/ChatWidget.jsx`](src/components/ChatWidget.jsx) issues `fetch("/api/chat", { method: "POST", body: JSON.stringify({ question }) })` and renders the returned answer inside the floating chat widget mounted in [`src/App.jsx`](src/App.jsx).

### Verification

The end-to-end wiring is locked in by a single integration test, [`backend/tests/test_integration_e2e.py`](backend/tests/test_integration_e2e.py), which:

1. Runs a Pandas stand-in of the Spark transform (same dedup + quarantine logic, no JVM) and writes JSON Lines into a `tmp_path/curated/` directory.
2. Loads `data_contracts/contract.yaml` and asserts the curated flights pass schema + quality + freshness checks.
3. Calls `build_corpus(curated_dir)` and asserts the curated trail reviews end up in the FAISS-indexed corpus and are retrievable.
4. POSTs a question to `/api/chat` through FastAPI's `TestClient` and asserts the response shape matches what the frontend's `ChatWidget` consumes.

```bash
# Run just the integration test
pytest backend/tests/test_integration_e2e.py -v

# Or the full suite (85 tests)
pytest backend/tests/ data_contracts/tests/
```

---

## Quick Start

```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
npm install

# Run backend (mock Stripe mode)
STRIPE_MOCK=true uvicorn backend.main:app --reload --port 8000

# Run frontend
npm run dev

# Run data contracts demo
python data_contracts/demo.py

# Run PySpark transforms (standalone)
pip install pyspark
python data_pipeline/spark_transform.py

# Run reverse ETL demo
python reverse_etl/push_to_crm.py
```

---

## Testing

```bash
# Backend tests
cd backend && pytest

# Data contracts tests
pytest data_contracts/tests/

# Frontend E2E tests (Playwright)
npx playwright test

# Run RAG pipeline demo
python backend/rag_pipeline.py
```

---

## Key Technologies

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, React Router |
| Backend | FastAPI, SQLAlchemy, Alembic, Stripe |
| AI/ML | LangChain, FAISS, sentence-transformers, HuggingFace |
| Data Engineering | Apache Airflow, PySpark, Pandas |
| Data Quality | Pydantic, PyYAML, custom validator |
| Testing | pytest, Playwright |
| Infrastructure | Docker, Docker Compose |
