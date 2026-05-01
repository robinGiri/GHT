"""Shared fixtures for backend API tests."""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Force mock mode before any app imports
os.environ["STRIPE_MOCK"] = "true"
os.environ["ADMIN_API_KEY"] = "test-admin-key"
os.environ["DATABASE_URL"] = "sqlite://"  # in-memory
os.environ["DOWNLOAD_SECRET"] = "test-download-secret"
os.environ["STRIPE_WEBHOOK_SECRET"] = ""  # disable signature verification in tests

from backend.database import Base, get_db
from backend.main import app
from backend.models.product import Product
from backend.models.order import Order, OrderItem


@pytest.fixture()
def db_session():
    """Create a fresh in-memory SQLite database for each test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Enable foreign keys in SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    """FastAPI test client with overridden DB dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_headers():
    """Headers for authenticated admin requests."""
    return {"X-Admin-Key": "test-admin-key"}


@pytest.fixture()
def sample_product(db_session):
    """Insert a single digital map product."""
    p = Product(
        id="NP101", type="digital_map", sku="NP101D",
        name="GHT Digital Map — Kanchenjunga", price=10.0,
        map_code="NP101", region="Kanchenjunga", region_tag="far-east",
        scale="1:100,000", file_url="/maps/NP101.pdf",
        file_label="PDF", active=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture()
def sample_book(db_session):
    """Insert a physical book product with stock."""
    p = Product(
        id="BOOK-001", type="physical_book", sku="9781905864607",
        name="Nepal Trekking — 3rd Edition", price=33.45,
        active=True, stock_quantity=50,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture()
def sample_donation(db_session):
    """Insert a donation product."""
    p = Product(
        id="DONATE-001", type="donation", sku="GHT-DONATE",
        name="Donate to the GHT", price=10.0, active=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture()
def sample_order(db_session, sample_product):
    """Insert a paid order with one digital item."""
    order = Order(
        stripe_session_id="cs_mock_test123",
        customer_email="test@example.com",
        customer_name="Test User",
        status="paid",
        total_amount=10.0,
        has_digital=1,
        has_physical=0,
    )
    db_session.add(order)
    db_session.flush()
    item = OrderItem(
        order_id=order.id,
        product_id="NP101",
        product_name="GHT Digital Map — Kanchenjunga",
        product_type="digital_map",
        quantity=1,
        price_at_purchase=10.0,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(order)
    return order
