import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function CartDrawer() {
  const { items, itemCount, subtotal, hasPhysical, drawerOpen, setDrawerOpen, removeItem, setQty, clearCart } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!drawerOpen) return null;

  async function handleCheckout(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const lineItems = items.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        type: item.type,
      }));

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: lineItems,
          customer_name: name.trim(),
          customer_email: email.trim(),
          has_physical: hasPhysical,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Checkout failed. Please try again.");
      }

      const { url } = await res.json();
      clearCart();
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="cart-backdrop"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="cart-drawer" aria-label="Shopping cart" role="dialog" aria-modal="true">
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Your Cart</h2>
          <button
            className="cart-drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button className="button button-secondary" onClick={() => setDrawerOpen(false)}>
              Browse the Shop
            </button>
          </div>
        ) : (
          <form className="cart-form" onSubmit={handleCheckout} noValidate>
            {/* Line items */}
            <ul className="cart-items" aria-label="Cart items">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    {item.mapCode && (
                      <span className="cart-item-code">{item.mapCode}</span>
                    )}
                    <span className="cart-item-name">{item.name}</span>
                    {item.type === "physical_book" && (
                      <span className="cart-item-badge cart-item-badge--physical">Physical — ships worldwide</span>
                    )}
                    {item.type === "digital_map" && (
                      <span className="cart-item-badge cart-item-badge--digital">Digital PDF</span>
                    )}
                  </div>
                  <div className="cart-item-controls">
                    <div className="cart-qty">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => item.qty === 1 ? removeItem(item.id) : setQty(item.id, item.qty - 1)}
                      >−</button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQty(item.id, item.qty + 1)}
                      >+</button>
                    </div>
                    <span className="cart-item-price">${(item.price * item.qty).toFixed(2)}</span>
                    <button
                      type="button"
                      className="cart-item-remove"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(item.id)}
                    >×</button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Subtotal */}
            <div className="cart-subtotal">
              <span>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>

            {/* Shipping notice */}
            {hasPhysical && (
              <p className="cart-shipping-note">
                📦 Your order contains a physical book. Shipping address will be collected at checkout.
              </p>
            )}

            {/* Customer details */}
            <div className="cart-customer">
              <label htmlFor="cart-name">Your name</label>
              <input
                id="cart-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
              />
              <label htmlFor="cart-email">Email for delivery</label>
              <input
                id="cart-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
              <p className="cart-email-note">
                Download links for digital maps will be sent to this address immediately after payment.
              </p>
            </div>

            {error && <p className="cart-error" role="alert">{error}</p>}

            <button
              type="submit"
              className="button button-primary cart-checkout-btn"
              disabled={loading}
            >
              {loading ? "Redirecting to payment…" : `Pay $${subtotal.toFixed(2)} securely`}
            </button>
          </form>
        )}
      </aside>
    </>
  );
}
