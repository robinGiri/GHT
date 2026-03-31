from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    stripe_session_id = Column(String, unique=True, nullable=False, index=True)
    customer_email = Column(String, nullable=False)
    customer_name = Column(String, nullable=True)
    shipping_address = Column(JSON, nullable=True)   # None for digital-only orders
    status = Column(String, default="pending")        # pending | paid | fulfilled | shipped
    total_amount = Column(Float, nullable=False)
    has_digital = Column(Integer, default=0)          # bool as int for SQLite compat
    has_physical = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    fulfilled_at = Column(DateTime, nullable=True)
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Float, nullable=False)
    order = relationship("Order", back_populates="items")
