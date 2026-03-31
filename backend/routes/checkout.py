import os
import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.product import Product
from backend.models.order import Order, OrderItem
from backend.schemas.order import CheckoutSessionCreate, CheckoutSessionOut

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

router = APIRouter()


@router.post("/checkout/session", response_model=CheckoutSessionOut)
def create_checkout_session(body: CheckoutSessionCreate, db: Session = Depends(get_db)):
    if not body.line_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    if not stripe.api_key or stripe.api_key.startswith("sk_test_your"):
        raise HTTPException(status_code=503, detail="Payment system not configured. Please set STRIPE_SECRET_KEY.")

    # Build Stripe line items
    stripe_line_items = []
    for item in body.line_items:
        if item.price <= 0:
            raise HTTPException(status_code=400, detail=f"Invalid price for {item.name}")
        stripe_line_items.append({
            "price_data": {
                "currency": "usd",
                "unit_amount": int(round(item.price * 100)),
                "product_data": {"name": item.name},
            },
            "quantity": item.quantity,
        })

    session_params = {
        "payment_method_types": ["card"],
        "line_items": stripe_line_items,
        "mode": "payment",
        "customer_email": body.customer_email,
        "success_url": f"{FRONTEND_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{FRONTEND_URL}/checkout/cancel",
        "metadata": {
            "customer_name": body.customer_name,
            "has_physical": "true" if body.has_physical else "false",
        },
    }

    # Collect shipping address for physical orders
    if body.has_physical:
        session_params["shipping_address_collection"] = {"allowed_countries": ["US", "GB", "AU", "CA", "NZ", "DE", "FR", "NL", "SG", "JP", "NP", "IN"]}

    try:
        session = stripe.checkout.Session.create(**session_params)
    except stripe.StripeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Create a pending Order record
    order = Order(
        stripe_session_id=session.id,
        customer_email=body.customer_email,
        customer_name=body.customer_name,
        status="pending",
        total_amount=sum(i.price * i.quantity for i in body.line_items),
        has_digital=int(any(i.type == "digital_map" for i in body.line_items)),
        has_physical=int(body.has_physical),
    )
    db.add(order)
    db.flush()

    for item in body.line_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.name,
            product_type=item.type,
            quantity=item.quantity,
            price_at_purchase=item.price,
        ))

    db.commit()
    return CheckoutSessionOut(url=session.url)


@router.get("/checkout/session/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.stripe_session_id == session_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "customer_email": order.customer_email,
        "customer_name": order.customer_name,
        "status": order.status,
        "total_amount": order.total_amount,
        "has_digital": bool(order.has_digital),
        "has_physical": bool(order.has_physical),
        "shipping_address": order.shipping_address,
    }
