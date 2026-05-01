"""Tests for /api/download/* secure download endpoint."""
import time
import hmac
import hashlib


DOWNLOAD_SECRET = "test-download-secret"


def _sign(order_id, product_id, expires):
    msg = f"{order_id}:{product_id}:{expires}"
    return hmac.new(DOWNLOAD_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()


class TestDownloadSecurity:
    def test_invalid_token_rejected(self, client, sample_order):
        resp = client.get(
            f"/api/download/{sample_order.id}/NP101?expires=9999999999&token=badtoken"
        )
        assert resp.status_code == 403
        assert "invalid" in resp.json()["detail"].lower()

    def test_expired_token_rejected(self, client, sample_order):
        expired = int(time.time()) - 3600  # 1 hour ago
        token = _sign(sample_order.id, "NP101", expired)
        resp = client.get(
            f"/api/download/{sample_order.id}/NP101?expires={expired}&token={token}"
        )
        assert resp.status_code == 403
        assert "expired" in resp.json()["detail"].lower()

    def test_wrong_order_id_rejected(self, client, sample_order):
        expires = int(time.time()) + 3600
        token = _sign(999, "NP101", expires)  # wrong order ID
        resp = client.get(
            f"/api/download/999/NP101?expires={expires}&token={token}"
        )
        assert resp.status_code == 403

    def test_unpaid_order_rejected(self, client, db_session, sample_product):
        from backend.models.order import Order, OrderItem
        order = Order(
            stripe_session_id="cs_unpaid",
            customer_email="test@example.com",
            status="pending", total_amount=10.0,
        )
        db_session.add(order)
        db_session.flush()
        db_session.add(OrderItem(
            order_id=order.id, product_id="NP101",
            product_name="Map", product_type="digital_map",
            quantity=1, price_at_purchase=10.0,
        ))
        db_session.commit()

        expires = int(time.time()) + 3600
        token = _sign(order.id, "NP101", expires)
        resp = client.get(
            f"/api/download/{order.id}/NP101?expires={expires}&token={token}"
        )
        assert resp.status_code == 403

    def test_product_not_in_order_rejected(self, client, sample_order):
        expires = int(time.time()) + 3600
        token = _sign(sample_order.id, "NP999", expires)
        resp = client.get(
            f"/api/download/{sample_order.id}/NP999?expires={expires}&token={token}"
        )
        assert resp.status_code == 403

    def test_valid_token_file_not_found(self, client, db_session, sample_product):
        """Valid token but PDF doesn't exist on disk → 404."""
        # Create an order with a product that has no PDF on disk
        from backend.models.order import Order, OrderItem
        order = Order(
            stripe_session_id="cs_mock_nofile",
            customer_email="test@example.com",
            status="paid", total_amount=10.0, has_digital=1,
        )
        db_session.add(order)
        db_session.flush()
        db_session.add(OrderItem(
            order_id=order.id, product_id="NP999",
            product_name="Missing Map", product_type="digital_map",
            quantity=1, price_at_purchase=10.0,
        ))
        db_session.commit()

        expires = int(time.time()) + 3600
        token = _sign(order.id, "NP999", expires)
        resp = client.get(
            f"/api/download/{order.id}/NP999?expires={expires}&token={token}"
        )
        assert resp.status_code == 404
        assert "not available" in resp.json()["detail"].lower()

    def test_path_traversal_rejected(self, client, sample_order):
        """Attempt path traversal via product_id."""
        malicious_id = "../../etc/passwd"
        expires = int(time.time()) + 3600
        token = _sign(sample_order.id, malicious_id, expires)
        resp = client.get(
            f"/api/download/{sample_order.id}/{malicious_id}?expires={expires}&token={token}"
        )
        # Should be rejected — either 403 (access denied) or 404
        assert resp.status_code in (403, 404, 422)
