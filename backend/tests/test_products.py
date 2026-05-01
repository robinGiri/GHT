"""Tests for GET /api/products endpoints."""


class TestListProducts:
    def test_returns_empty_when_no_products(self, client):
        resp = client.get("/api/products")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_active_products(self, client, sample_product):
        resp = client.get("/api/products")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == "NP101"
        assert data[0]["name"] == "GHT Digital Map — Kanchenjunga"
        assert data[0]["price"] == 10.0

    def test_excludes_inactive_products(self, client, db_session, sample_product):
        sample_product.active = False
        db_session.commit()
        resp = client.get("/api/products")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_filter_by_type(self, client, sample_product, sample_book):
        resp = client.get("/api/products?type=digital_map")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["type"] == "digital_map"

        resp = client.get("/api/products?type=physical_book")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["type"] == "physical_book"

    def test_does_not_expose_file_url(self, client, sample_product):
        resp = client.get("/api/products")
        data = resp.json()[0]
        assert "file_url" not in data
        assert data["has_file_url"] is True


class TestGetProduct:
    def test_returns_product_by_id(self, client, sample_product):
        resp = client.get("/api/products/NP101")
        assert resp.status_code == 200
        assert resp.json()["id"] == "NP101"

    def test_404_for_missing_product(self, client):
        resp = client.get("/api/products/NONEXISTENT")
        assert resp.status_code == 404

    def test_404_for_inactive_product(self, client, db_session, sample_product):
        sample_product.active = False
        db_session.commit()
        resp = client.get("/api/products/NP101")
        assert resp.status_code == 404
