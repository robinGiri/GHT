"""Gap-coverage tests — target all uncovered branches across the codebase."""
from __future__ import annotations

import io
import json
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

ADMIN_HEADERS = {"X-Admin-Key": "test-admin-key"}


# ---------------------------------------------------------------------------
# backend/rag_pipeline.py — uncovered branches
# ---------------------------------------------------------------------------

class TestRagPipelineGaps:
    def test_mock_llm_unparseable_prompt(self):
        from backend.rag_pipeline import MockLLM
        llm = MockLLM()
        out = llm._call("no markers here")
        assert "could not parse" in out.lower()

    def test_mock_llm_identifying_params(self):
        from backend.rag_pipeline import MockLLM
        assert MockLLM()._identifying_params == {}
        assert MockLLM()._llm_type == "mock_llm"

    def test_load_curated_reviews_missing_dir(self, tmp_path):
        from backend.rag_pipeline import load_curated_reviews
        assert load_curated_reviews(str(tmp_path / "nope")) == []

    def test_load_curated_reviews_skips_bad_lines_and_non_json(self, tmp_path):
        from backend.rag_pipeline import load_curated_reviews
        d = tmp_path / "trail_reviews_clean"
        d.mkdir()
        (d / "skip-me.txt").write_text("ignored")
        with open(d / "part-0000.json", "w") as fh:
            fh.write('{"review_text": "good one"}\n')
            fh.write("\n")
            fh.write("not-json-at-all\n")
            fh.write('{"no_review_text": "nope"}\n')
        out = load_curated_reviews(str(tmp_path))
        assert out == ["good one"]

    def test_build_corpus_without_curated(self):
        from backend.rag_pipeline import DOCUMENTS, build_corpus
        assert build_corpus() == list(DOCUMENTS)

    def test_ask_helper_prints(self, capsys):
        from backend.rag_pipeline import ask
        chain = MagicMock()
        chain.invoke.return_value = {
            "result": "answer",
            "source_documents": [MagicMock(page_content="src1"), MagicMock(page_content="src2")],
        }
        ask(chain, "hello?")
        captured = capsys.readouterr().out
        assert "answer" in captured and "hello?" in captured


# ---------------------------------------------------------------------------
# backend/seed.py — existing-product file_url update + error path
# ---------------------------------------------------------------------------

class TestSeedGaps:
    def test_seed_updates_existing_file_url(self, db_session, monkeypatch):
        from backend.models.product import Product
        # Insert product without file_url
        from backend import seed as seed_mod
        from backend.database import SessionLocal as RealSessionLocal  # noqa
        existing = Product(
            id="NP101", type="digital_map", sku="ght-NP101",
            name="Test Map", description="...", price=10.0, active=True,
        )
        db_session.add(existing)
        db_session.commit()

        # Patch SessionLocal in seed to use our test session
        monkeypatch.setattr(seed_mod, "SessionLocal", lambda: db_session)
        # Avoid db_session.close() killing the fixture
        monkeypatch.setattr(db_session, "close", lambda: None)

        # Run seeder — NP101 in PRODUCTS has a file_url, existing has none
        seed_mod.seed_products()
        refreshed = db_session.query(Product).filter(Product.id == "NP101").first()
        assert refreshed.file_url is not None

    def test_seed_handles_db_error(self, db_session, monkeypatch, capsys):
        from backend import seed as seed_mod
        monkeypatch.setattr(seed_mod, "SessionLocal", lambda: db_session)
        monkeypatch.setattr(db_session, "close", lambda: None)

        def boom(*_a, **_k):
            raise RuntimeError("db boom")
        monkeypatch.setattr(db_session, "query", boom)
        seed_mod.seed_products()
        out = capsys.readouterr().out
        assert "Error" in out


# ---------------------------------------------------------------------------
# backend/routes/admin.py — uncovered branches
# ---------------------------------------------------------------------------

class TestAdminGaps:
    def test_create_product_conflict_returns_409(self, client, sample_product):
        payload = {
            "id": sample_product.id, "type": "digital_map", "sku": "dup",
            "name": "Dup", "description": "x", "price": 5.0,
        }
        resp = client.post("/api/admin/products", headers=ADMIN_HEADERS, json=payload)
        assert resp.status_code == 409

    def test_delete_missing_product_returns_404(self, client):
        resp = client.delete("/api/admin/products/DOES-NOT-EXIST", headers=ADMIN_HEADERS)
        assert resp.status_code == 404

    def test_update_inventory_missing_product_returns_404(self, client):
        resp = client.put(
            "/api/admin/inventory/DOES-NOT-EXIST",
            headers=ADMIN_HEADERS,
            json={"stock_quantity": 5},
        )
        assert resp.status_code == 404

    def test_resend_links_no_digital_items_returns_400(self, client, db_session, sample_book):
        from backend.models.order import Order, OrderItem
        order = Order(
            stripe_session_id="cs_mock_book_only",
            customer_email="book@x.com", customer_name="Book Buyer",
            status="paid", total_amount=33.45, has_digital=0, has_physical=1,
        )
        db_session.add(order)
        db_session.flush()
        db_session.add(OrderItem(
            order_id=order.id, product_id=sample_book.id,
            product_name=sample_book.name, product_type="physical_book",
            quantity=1, price_at_purchase=sample_book.price,
        ))
        db_session.commit()
        resp = client.post(
            f"/api/admin/orders/{order.id}/resend-links",
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 400

    def test_resend_links_missing_order_returns_404(self, client):
        resp = client.post("/api/admin/orders/99999/resend-links", headers=ADMIN_HEADERS)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# backend/routes/checkout.py — real Stripe path with mocked stripe lib
# ---------------------------------------------------------------------------

class TestCheckoutGaps:
    def test_real_stripe_path_with_physical_item(self, client, sample_book, monkeypatch):
        from backend.routes import checkout as checkout_mod

        # Force non-mock mode and a real-looking stripe key
        monkeypatch.setattr(checkout_mod, "STRIPE_MOCK", False)
        monkeypatch.setattr(checkout_mod.stripe, "api_key", "sk_test_real_looking_key")

        fake_session = MagicMock()
        fake_session.id = "cs_real_123"
        fake_session.url = "https://stripe.example/checkout/cs_real_123"
        monkeypatch.setattr(
            checkout_mod.stripe.checkout.Session,
            "create",
            MagicMock(return_value=fake_session),
        )

        resp = client.post("/api/checkout/session", json={
            "customer_email": "buyer@example.com",
            "customer_name": "Real Buyer",
            "has_physical": True,
            "line_items": [{
                "product_id": sample_book.id,
                "name": sample_book.name,
                "price": sample_book.price,
                "quantity": 1,
                "type": sample_book.type,
            }],
        })
        assert resp.status_code == 200
        assert "cs_real_123" in resp.json()["url"]

    def test_real_stripe_error_returns_502(self, client, sample_product, monkeypatch):
        import stripe as stripe_lib
        from backend.routes import checkout as checkout_mod

        monkeypatch.setattr(checkout_mod, "STRIPE_MOCK", False)
        monkeypatch.setattr(checkout_mod.stripe, "api_key", "sk_test_real_looking_key")

        def boom(**_k):
            raise stripe_lib.StripeError("boom")
        monkeypatch.setattr(checkout_mod.stripe.checkout.Session, "create", boom)

        resp = client.post("/api/checkout/session", json={
            "customer_email": "x@x.com",
            "customer_name": "x",
            "has_physical": False,
            "line_items": [{
                "product_id": sample_product.id,
                "name": sample_product.name,
                "price": sample_product.price,
                "quantity": 1,
                "type": sample_product.type,
            }],
        })
        assert resp.status_code == 502


# ---------------------------------------------------------------------------
# backend/routes/webhook.py — uncovered branches
# ---------------------------------------------------------------------------

class TestWebhookGaps:
    def test_webhook_no_secret_non_mock_returns_503(self, client, monkeypatch):
        from backend.routes import webhook as wh
        monkeypatch.setattr(wh, "WEBHOOK_SECRET", "")
        monkeypatch.setattr(wh, "STRIPE_MOCK", False)
        resp = client.post("/api/webhook", content=b"{}", headers={"stripe-signature": "x"})
        assert resp.status_code == 503

    def test_webhook_signature_failure_returns_400(self, client, monkeypatch):
        from backend.routes import webhook as wh
        import stripe as stripe_lib

        monkeypatch.setattr(wh, "WEBHOOK_SECRET", "whsec_test")

        def bad_sig(*_a, **_k):
            raise stripe_lib.error.SignatureVerificationError("bad", "sig", "header")
        monkeypatch.setattr(wh.stripe.Webhook, "construct_event", bad_sig)
        resp = client.post(
            "/api/webhook", content=b"{}", headers={"stripe-signature": "sig_bad"}
        )
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# backend/routes/download.py — uncovered branches
# ---------------------------------------------------------------------------

class TestDownloadGaps:
    def test_download_missing_file_returns_404(self, client, db_session, sample_order):
        from backend.models.order import OrderItem
        from backend.routes.download import generate_download_url
        # Add an order item that won't have a corresponding PDF on disk
        db_session.add(OrderItem(
            order_id=sample_order.id,
            product_id="NP-NO-FILE-ON-DISK",
            product_name="Missing", product_type="digital_map",
            quantity=1, price_at_purchase=5.0,
        ))
        db_session.commit()
        url = generate_download_url(sample_order.id, "NP-NO-FILE-ON-DISK")
        resp = client.get(url)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# backend/database.py — get_db generator + create_tables fallback
# ---------------------------------------------------------------------------

class TestDatabaseGaps:
    def test_get_db_yields_then_closes(self):
        from backend.database import get_db
        gen = get_db()
        db = next(gen)
        assert db is not None
        gen.close()  # triggers finally → close


# ---------------------------------------------------------------------------
# data_contracts/demo.py — run main()
# ---------------------------------------------------------------------------

class TestDataContractsDemo:
    def test_demo_main_runs(self, capsys):
        # demo.py does sys.path manipulation; importing twice is safe.
        import importlib
        import data_contracts.demo as demo_mod
        importlib.reload(demo_mod)
        demo_mod.main()
        out = capsys.readouterr().out
        assert "Validation Summary" in out
        assert "Quarantine" in out


# ---------------------------------------------------------------------------
# reverse_etl/push_to_crm.py — main + failure path + exception path
# ---------------------------------------------------------------------------

class TestReverseEtl:
    def test_main_runs_end_to_end(self, capsys):
        from reverse_etl.push_to_crm import main
        main()
        out = capsys.readouterr().out
        assert "Reverse ETL complete" in out
        assert "Synced to CRM" in out

    def test_run_reverse_etl_handles_non_2xx_response(self):
        from reverse_etl.push_to_crm import (
            CRMResponse,
            MockCRMClient,
            load_customer_leads,
            run_reverse_etl,
        )

        class FailingCRM(MockCRMClient):
            def push_contact(self, lead):
                return CRMResponse(status_code=500, crm_contact_id="-", message="boom")

        result = run_reverse_etl(load_customer_leads(), crm=FailingCRM(), min_lead_score=0)
        assert result.failed == result.total_leads
        assert all(d["status"] == "failed" for d in result.details)

    def test_run_reverse_etl_handles_exception(self):
        from reverse_etl.push_to_crm import (
            MockCRMClient,
            load_customer_leads,
            run_reverse_etl,
        )

        class ThrowingCRM(MockCRMClient):
            def push_contact(self, lead):
                raise RuntimeError("network down")

        result = run_reverse_etl(load_customer_leads(), crm=ThrowingCRM(), min_lead_score=0)
        assert result.failed == result.total_leads
        assert all(d["status"] == "error" for d in result.details)


# ---------------------------------------------------------------------------
# data_pipeline/spark_transform.py — exercise non-Spark helpers + validate
# ---------------------------------------------------------------------------

class TestSparkTransformHelpers:
    def test_generate_mock_data_writes_files(self, tmp_path):
        from data_pipeline.spark_transform import generate_mock_data
        flights, reviews = generate_mock_data(str(tmp_path))
        assert Path(flights).exists() and Path(reviews).exists()
        assert json.loads(Path(flights).read_text())  # valid JSON
        assert isinstance(json.loads(Path(reviews).read_text()), list)

    def test_validate_with_contract_no_files(self, tmp_path, capsys):
        from data_pipeline.spark_transform import validate_with_contract
        validate_with_contract(str(tmp_path))  # no flights_clean/ → skip
        out = capsys.readouterr().out
        assert "No curated" in out

    def test_validate_with_contract_with_curated_data(self, tmp_path, capsys):
        from data_pipeline.spark_transform import validate_with_contract
        clean_dir = tmp_path / "flights_clean"
        clean_dir.mkdir()
        df = pd.DataFrame({
            "flight_id": ["F1", "F2"],
            "flight_status": ["on_time", "delayed"],
            "temperature": [12.5, 8.5],
            "departure_airport": ["KTM", "LUA"],
            "arrival_airport": ["LUA", "KTM"],
            "departure_time": pd.to_datetime(["2026-04-29", "2026-04-29"]),
        })
        df["temperature"] = df["temperature"].astype(float)
        df.to_json(clean_dir / "part-0000.json", orient="records", lines=True)
        validate_with_contract(str(tmp_path))
        out = capsys.readouterr().out
        assert "[contract]" in out
