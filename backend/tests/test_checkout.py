"""Tests for POST /api/checkout/session and GET /api/checkout/session/{id}."""


def _checkout_body(items, name="Test User", email="test@example.com", has_physical=False):
    return {
        "line_items": items,
        "customer_name": name,
        "customer_email": email,
        "has_physical": has_physical,
    }


class TestCreateCheckoutSession:
    def test_successful_digital_checkout(self, client, sample_product):
        body = _checkout_body([{
            "product_id": "NP101", "name": "Map", "price": 10.0,
            "quantity": 1, "type": "digital_map",
        }])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 200
        data = resp.json()
        assert "url" in data
        assert "cs_mock_" in data["url"]

    def test_successful_physical_checkout(self, client, sample_book):
        body = _checkout_body(
            [{"product_id": "BOOK-001", "name": "Book", "price": 33.45,
              "quantity": 1, "type": "physical_book"}],
            has_physical=True,
        )
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 200

    def test_multi_item_checkout(self, client, sample_product, sample_book):
        body = _checkout_body([
            {"product_id": "NP101", "name": "Map", "price": 10.0,
             "quantity": 2, "type": "digital_map"},
            {"product_id": "BOOK-001", "name": "Book", "price": 33.45,
             "quantity": 1, "type": "physical_book"},
        ], has_physical=True)
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 200

    def test_empty_cart_rejected(self, client):
        body = _checkout_body([])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()

    def test_nonexistent_product_rejected(self, client):
        body = _checkout_body([{
            "product_id": "FAKE", "name": "Fake", "price": 5.0,
            "quantity": 1, "type": "digital_map",
        }])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 400
        assert "not found" in resp.json()["detail"].lower()

    def test_price_mismatch_rejected(self, client, sample_product):
        body = _checkout_body([{
            "product_id": "NP101", "name": "Map", "price": 1.00,
            "quantity": 1, "type": "digital_map",
        }])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 400
        assert "price mismatch" in resp.json()["detail"].lower()

    def test_negative_price_rejected(self, client, sample_product):
        body = _checkout_body([{
            "product_id": "NP101", "name": "Map", "price": -5.0,
            "quantity": 1, "type": "digital_map",
        }])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 400

    def test_zero_quantity_rejected(self, client, sample_product):
        body = _checkout_body([{
            "product_id": "NP101", "name": "Map", "price": 10.0,
            "quantity": 0, "type": "digital_map",
        }])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 400

    def test_insufficient_stock_rejected(self, client, db_session, sample_book):
        sample_book.stock_quantity = 1
        db_session.commit()
        body = _checkout_body([{
            "product_id": "BOOK-001", "name": "Book", "price": 33.45,
            "quantity": 5, "type": "physical_book",
        }])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 400
        assert "stock" in resp.json()["detail"].lower()

    def test_order_created_in_db(self, client, db_session, sample_product):
        body = _checkout_body([{
            "product_id": "NP101", "name": "Map", "price": 10.0,
            "quantity": 1, "type": "digital_map",
        }])
        resp = client.post("/api/checkout/session", json=body)
        assert resp.status_code == 200

        from backend.models.order import Order
        orders = db_session.query(Order).all()
        assert len(orders) == 1
        assert orders[0].customer_email == "test@example.com"
        assert orders[0].status == "paid"  # mock mode auto-marks paid
        assert orders[0].total_amount == 10.0

    def test_order_items_created(self, client, db_session, sample_product):
        body = _checkout_body([{
            "product_id": "NP101", "name": "Map", "price": 10.0,
            "quantity": 2, "type": "digital_map",
        }])
        client.post("/api/checkout/session", json=body)

        from backend.models.order import Order
        order = db_session.query(Order).first()
        assert len(order.items) == 1
        assert order.items[0].quantity == 2
        assert order.items[0].price_at_purchase == 10.0


class TestGetSession:
    def test_returns_order_data(self, client, sample_order):
        resp = client.get("/api/checkout/session/cs_mock_test123")
        assert resp.status_code == 200
        data = resp.json()
        assert data["customer_email"] == "test@example.com"
        assert data["status"] == "paid"
        assert data["total_amount"] == 10.0
        assert len(data["items"]) == 1

    def test_includes_download_url_for_digital(self, client, sample_order):
        resp = client.get("/api/checkout/session/cs_mock_test123")
        data = resp.json()
        item = data["items"][0]
        assert "download_url" in item
        assert "/api/download/" in item["download_url"]

    def test_404_for_missing_session(self, client):
        resp = client.get("/api/checkout/session/nonexistent")
        assert resp.status_code == 404
