"""Tests for /api/admin/* endpoints."""
import pytest


ADMIN_HEADERS = {"X-Admin-Key": "test-admin-key"}
BAD_HEADERS = {"X-Admin-Key": "wrong-key"}


class TestAdminAuth:
    def test_missing_key_returns_422(self, client):
        resp = client.get("/api/admin/products")
        assert resp.status_code == 422  # missing required header

    def test_wrong_key_returns_401(self, client):
        resp = client.get("/api/admin/products", headers=BAD_HEADERS)
        assert resp.status_code == 401

    def test_valid_key_succeeds(self, client):
        resp = client.get("/api/admin/products", headers=ADMIN_HEADERS)
        assert resp.status_code == 200


class TestAdminProducts:
    def test_list_products_empty(self, client):
        resp = client.get("/api/admin/products", headers=ADMIN_HEADERS)
        data = resp.json()
        assert data["total"] == 0
        assert data["items"] == []

    def test_list_products_with_pagination(self, client, sample_product, sample_book):
        resp = client.get("/api/admin/products?offset=0&limit=1", headers=ADMIN_HEADERS)
        data = resp.json()
        assert data["total"] == 2
        assert len(data["items"]) == 1

    def test_list_products_exposes_file_url(self, client, sample_product):
        resp = client.get("/api/admin/products", headers=ADMIN_HEADERS)
        item = resp.json()["items"][0]
        assert "file_url" in item
        assert item["file_url"] == "/maps/NP101.pdf"

    def test_create_product(self, client):
        product = {
            "id": "TEST-001", "type": "digital_map",
            "name": "Test Map", "price": 5.0,
        }
        resp = client.post("/api/admin/products", json=product, headers=ADMIN_HEADERS)
        assert resp.status_code == 200
        assert resp.json()["id"] == "TEST-001"

    def test_create_duplicate_product_returns_409(self, client, sample_product):
        product = {
            "id": "NP101", "type": "digital_map",
            "name": "Duplicate", "price": 5.0,
        }
        resp = client.post("/api/admin/products", json=product, headers=ADMIN_HEADERS)
        assert resp.status_code == 409

    def test_update_product(self, client, sample_product):
        resp = client.put(
            "/api/admin/products/NP101",
            json={"price": 15.0, "name": "Updated Map"},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.json()["price"] == 15.0
        assert resp.json()["name"] == "Updated Map"

    def test_update_nonexistent_returns_404(self, client):
        resp = client.put(
            "/api/admin/products/FAKE",
            json={"price": 5.0},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 404

    def test_delete_product_soft_deletes(self, client, db_session, sample_product):
        resp = client.delete("/api/admin/products/NP101", headers=ADMIN_HEADERS)
        assert resp.status_code == 200
        assert resp.json()["status"] == "deactivated"
        # Verify soft-deleted
        db_session.refresh(sample_product)
        assert sample_product.active is False


class TestAdminInventory:
    def test_list_inventory(self, client, sample_product, sample_book):
        resp = client.get("/api/admin/inventory", headers=ADMIN_HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_low_stock_flag(self, client, db_session, sample_book):
        sample_book.stock_quantity = 3
        db_session.commit()
        resp = client.get("/api/admin/inventory", headers=ADMIN_HEADERS)
        book_item = [i for i in resp.json() if i["id"] == "BOOK-001"][0]
        assert book_item["low_stock"] is True

    def test_update_inventory(self, client, sample_book):
        resp = client.put(
            "/api/admin/inventory/BOOK-001",
            json={"stock_quantity": 100},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200


class TestAdminOrders:
    def test_list_orders_empty(self, client):
        resp = client.get("/api/admin/orders", headers=ADMIN_HEADERS)
        data = resp.json()
        assert data["total"] == 0

    def test_list_orders_with_data(self, client, sample_order):
        resp = client.get("/api/admin/orders", headers=ADMIN_HEADERS)
        data = resp.json()
        assert data["total"] == 1

    def test_filter_orders_by_status(self, client, sample_order):
        resp = client.get("/api/admin/orders?status=paid", headers=ADMIN_HEADERS)
        assert resp.json()["total"] == 1

        resp = client.get("/api/admin/orders?status=pending", headers=ADMIN_HEADERS)
        assert resp.json()["total"] == 0

    def test_get_order_by_id(self, client, sample_order):
        resp = client.get(f"/api/admin/orders/{sample_order.id}", headers=ADMIN_HEADERS)
        assert resp.status_code == 200
        assert resp.json()["customer_email"] == "test@example.com"

    def test_get_order_404(self, client):
        resp = client.get("/api/admin/orders/999", headers=ADMIN_HEADERS)
        assert resp.status_code == 404

    def test_update_order_status(self, client, sample_order):
        resp = client.put(
            f"/api/admin/orders/{sample_order.id}",
            json={"status": "fulfilled"},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "fulfilled"
        assert resp.json()["fulfilled_at"] is not None

    def test_update_order_invalid_status(self, client, sample_order):
        resp = client.put(
            f"/api/admin/orders/{sample_order.id}",
            json={"status": "bogus"},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 400


class TestAdminDashboard:
    def test_dashboard_empty(self, client):
        resp = client.get("/api/admin/dashboard", headers=ADMIN_HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_revenue"] == 0
        assert data["total_orders"] == 0

    def test_dashboard_with_order(self, client, sample_order):
        resp = client.get("/api/admin/dashboard", headers=ADMIN_HEADERS)
        data = resp.json()
        assert data["total_revenue"] == 10.0
        assert data["total_orders"] == 1
