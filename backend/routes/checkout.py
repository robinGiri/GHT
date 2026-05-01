import os
import uuid
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.product import Product
from backend.models.order import Order, OrderItem
from backend.schemas.order import CheckoutSessionCreate, CheckoutSessionOut
from backend import BUNDLE_MAP_IDS
from backend.limiter import limiter

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
STRIPE_MOCK = os.getenv("STRIPE_MOCK", "false").lower() in ("true", "1", "yes")

router = APIRouter()


def _is_stripe_configured() -> bool:
    return bool(stripe.api_key) and not stripe.api_key.startswith("sk_test_your")


@router.post("/checkout/session", response_model=CheckoutSessionOut)
@limiter.limit("5/minute")
def create_checkout_session(request: Request, body: CheckoutSessionCreate, db: Session = Depends(get_db)):
    if not body.line_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate each line item against the database
    for item in body.line_items:
        if item.price <= 0 or item.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Invalid price or quantity for {item.name}")
        product = db.query(Product).filter(Product.id == item.product_id, Product.active == True).first()  # noqa: E712
        if not product:
            raise HTTPException(status_code=400, detail=f"Product not found: {item.product_id}")
        if abs(item.price - product.price) > 0.01:
            raise HTTPException(status_code=400, detail=f"Price mismatch for {item.product_id}")
        # Check stock for physical items
        if product.type == "physical_book" and product.stock_quantity is not None:
            if product.stock_quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

    use_mock = STRIPE_MOCK or not _is_stripe_configured()

    if use_mock:
        # Mock mode: create a fake session ID and redirect straight to success
        mock_session_id = f"cs_mock_{uuid.uuid4().hex[:24]}"
        mock_url = f"{FRONTEND_URL}/checkout/success?session_id={mock_session_id}"
    else:
        # Build Stripe line items
        stripe_line_items = []
        for item in body.line_items:
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

    session_id = mock_session_id if use_mock else session.id
    redirect_url = mock_url if use_mock else session.url

    # Create a pending Order record (mock orders are auto-marked "paid")
    order = Order(
        stripe_session_id=session_id,
        customer_email=body.customer_email,
        customer_name=body.customer_name,
        status="paid" if use_mock else "pending",
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

    if use_mock:
        print(f"[STRIPE MOCK] Session {session_id} created → redirecting to success page")

    return CheckoutSessionOut(url=redirect_url)


@router.get("/checkout/session/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.stripe_session_id == session_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build download links for digital items in paid orders
    items = []
    if order.status in ("paid", "fulfilled", "shipped"):
        from backend.routes.download import generate_download_url
        for oi in order.items:
            item_data = {
                "product_id": oi.product_id,
                "product_name": oi.product_name,
                "product_type": oi.product_type,
                "quantity": oi.quantity,
                "price": oi.price_at_purchase,
            }
            if oi.product_type == "digital_map":
                if oi.product_id == "BUNDLE-ALL":
                    # Bundle: generate links for all individual maps
                    item_data["download_urls"] = [
                        {"map_code": m, "url": generate_download_url(order.id, m)}
                        for m in BUNDLE_MAP_IDS
                    ]
                else:
                    item_data["download_url"] = generate_download_url(order.id, oi.product_id)
            items.append(item_data)

    return {
        "customer_email": order.customer_email,
        "customer_name": order.customer_name,
        "status": order.status,
        "total_amount": order.total_amount,
        "has_digital": bool(order.has_digital),
        "has_physical": bool(order.has_physical),
        "shipping_address": order.shipping_address,
        "items": items,
    }
