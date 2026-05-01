import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models.product import Product
from backend.models.order import Order
from backend.schemas.product import ProductCreate, ProductUpdate, ProductOut
from backend.schemas.order import OrderOut, OrderStatusUpdate
from backend.routes.webhook import send_email, build_digital_email

router = APIRouter()

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
LOW_STOCK_THRESHOLD = 5


def require_admin(x_admin_key: str = Header(...)):
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def product_to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id, type=p.type, sku=p.sku, name=p.name, description=p.description,
        price=p.price, active=p.active, map_code=p.map_code, scale=p.scale,
        region=p.region, region_tag=p.region_tag, file_label=p.file_label, badge=p.badge,
        updated_year=p.updated_year, stock_quantity=p.stock_quantity,
        has_file_url=bool(p.file_url), created_at=p.created_at,
    )


# ── Products ────────────────────────────────────────────────────────────────

@router.get("/admin/products", dependencies=[Depends(require_admin)])
def admin_list_products(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Product).order_by(Product.map_code.asc().nulls_last(), Product.name.asc())
    total = q.count()
    products = q.offset(offset).limit(limit).all()
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [
            {**product_to_out(p).model_dump(), "file_url": p.file_url}
            for p in products
        ],
    }


@router.post("/admin/products", response_model=ProductOut, dependencies=[Depends(require_admin)])
def admin_create_product(data: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.id == data.id).first():
        raise HTTPException(status_code=409, detail="Product ID already exists")
    p = Product(**data.model_dump())
    p.created_at = datetime.utcnow()
    p.updated_at = datetime.utcnow()
    db.add(p)
    db.commit()
    db.refresh(p)
    return product_to_out(p)


@router.put("/admin/products/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
def admin_update_product(product_id: str, data: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)
    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return product_to_out(p)


@router.delete("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
def admin_delete_product(product_id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.active = False  # soft delete
    db.commit()
    return {"status": "deactivated"}


# ── Inventory ────────────────────────────────────────────────────────────────

@router.get("/admin/inventory", dependencies=[Depends(require_admin)])
def admin_inventory(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.active == True).all()  # noqa: E712
    return [
        {
            "id": p.id,
            "name": p.name,
            "type": p.type,
            "stock_quantity": p.stock_quantity,
            "file_url": p.file_url,
            "low_stock": p.stock_quantity is not None and p.stock_quantity <= LOW_STOCK_THRESHOLD,
        }
        for p in products
    ]


@router.put("/admin/inventory/{product_id}", dependencies=[Depends(require_admin)])
def admin_update_inventory(product_id: str, body: dict, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if "stock_quantity" in body:
        p.stock_quantity = body["stock_quantity"]
    if "file_url" in body:
        p.file_url = body["file_url"]
    p.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "updated"}


# ── Orders ────────────────────────────────────────────────────────────────

@router.get("/admin/orders", dependencies=[Depends(require_admin)])
def admin_list_orders(
    status: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Order).options(joinedload(Order.items))
    if status:
        q = q.filter(Order.status == status)
    total = q.count()
    orders = q.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": orders,
    }


@router.get("/admin/orders/{order_id}", response_model=OrderOut, dependencies=[Depends(require_admin)])
def admin_get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/admin/orders/{order_id}", response_model=OrderOut, dependencies=[Depends(require_admin)])
def admin_update_order(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = {"pending", "paid", "fulfilled", "shipped", "cancelled"}
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    if data.status in {"fulfilled", "shipped"}:
        order.fulfilled_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


@router.post("/admin/orders/{order_id}/resend-links", dependencies=[Depends(require_admin)])
def resend_download_links(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    digital_items = []
    for item in order.items:
        if item.product_type == "digital_map":
            product = db.query(Product).filter(Product.id == item.product_id).first()
            file_url = product.file_url if product else None
            digital_items.append((item.product_name, file_url))

    if not digital_items:
        raise HTTPException(status_code=400, detail="No digital items in this order")

    html = build_digital_email(order.customer_name or "", digital_items)
    send_email(order.customer_email, "Your GHT Map Downloads (resent)", html)
    return {"status": "sent", "to": order.customer_email}


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/admin/dashboard", dependencies=[Depends(require_admin)])
def admin_dashboard(db: Session = Depends(get_db)):
    total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.status == "paid").scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    pending_fulfillment = db.query(func.count(Order.id)).filter(Order.status == "paid", Order.has_physical == 1).scalar() or 0

    today = datetime.utcnow().date()
    orders_today = db.query(func.count(Order.id)).filter(
        func.date(Order.created_at) == today, Order.status != "pending"
    ).scalar() or 0

    revenue_today = db.query(func.sum(Order.total_amount)).filter(
        func.date(Order.created_at) == today, Order.status == "paid"
    ).scalar() or 0

    # Low stock products
    low_stock = db.query(Product).filter(
        Product.active == True,  # noqa: E712
        Product.stock_quantity <= LOW_STOCK_THRESHOLD,
        Product.stock_quantity != None,  # noqa: E711
    ).all()

    # Maps without file URLs
    maps_no_url = db.query(func.count(Product.id)).filter(
        Product.active == True,  # noqa: E712
        Product.type == "digital_map",
        Product.file_url == None,  # noqa: E711
    ).scalar() or 0

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "orders_today": orders_today,
        "revenue_today": round(revenue_today, 2),
        "pending_book_fulfillment": pending_fulfillment,
        "low_stock_products": [{"id": p.id, "name": p.name, "qty": p.stock_quantity} for p in low_stock],
        "maps_missing_file_url": maps_no_url,
    }
