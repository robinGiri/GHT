"""Tests for /api/webhook endpoint."""
import json


class TestStripeWebhook:
    def _webhook_event(self, session_id, event_type="checkout.session.completed"):
        return {
            "type": event_type,
            "data": {
                "object": {
                    "id": session_id,
                    "metadata": {"customer_name": "Test", "has_physical": "false"},
                }
            },
        }

    def test_webhook_marks_order_paid(self, client, db_session, sample_product):
        # Create a pending order first
        from backend.models.order import Order, OrderItem
        order = Order(
            stripe_session_id="cs_webhook_test",
            customer_email="buyer@example.com",
            customer_name="Buyer",
            status="pending",
            total_amount=10.0,
            has_digital=1,
        )
        db_session.add(order)
        db_session.flush()
        db_session.add(OrderItem(
            order_id=order.id, product_id="NP101",
            product_name="Map", product_type="digital_map",
            quantity=1, price_at_purchase=10.0,
        ))
        db_session.commit()

        event = self._webhook_event("cs_webhook_test")
        resp = client.post("/api/webhook", content=json.dumps(event))
        assert resp.status_code == 200

        db_session.refresh(order)
        assert order.status == "paid"

    def test_webhook_decrements_book_stock(self, client, db_session, sample_book):
        from backend.models.order import Order, OrderItem
        order = Order(
            stripe_session_id="cs_book_test",
            customer_email="buyer@example.com",
            customer_name="Buyer",
            status="pending",
            total_amount=33.45,
            has_physical=1,
        )
        db_session.add(order)
        db_session.flush()
        db_session.add(OrderItem(
            order_id=order.id, product_id="BOOK-001",
            product_name="Book", product_type="physical_book",
            quantity=2, price_at_purchase=33.45,
        ))
        db_session.commit()

        event = self._webhook_event("cs_book_test")
        resp = client.post("/api/webhook", content=json.dumps(event))
        assert resp.status_code == 200

        db_session.refresh(sample_book)
        assert sample_book.stock_quantity == 48  # 50 - 2

    def test_webhook_unknown_session(self, client):
        event = self._webhook_event("cs_nonexistent")
        resp = client.post("/api/webhook", content=json.dumps(event))
        assert resp.status_code == 200
        assert resp.json()["status"] == "order not found"

    def test_webhook_ignores_other_events(self, client):
        event = {"type": "payment_intent.created", "data": {"object": {}}}
        resp = client.post("/api/webhook", content=json.dumps(event))
        assert resp.status_code == 200
