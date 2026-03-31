import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ShopHeader from "../components/ShopHeader";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/checkout/session/${sessionId}`)
      .then((r) => r.json())
      .then((data) => { setSession(data); setLoading(false); })
      .catch(() => { setError("Could not load order details."); setLoading(false); });
  }, [sessionId]);

  return (
    <div className="page-shell">
      <ShopHeader />
      <main className="checkout-result-main">
        <div className="container checkout-result-inner">
          <div className="checkout-result-icon checkout-result-icon--success" aria-hidden="true">✓</div>
          <h1 className="checkout-result-title">Payment successful!</h1>

          {loading && <p>Loading order details…</p>}

          {!loading && session && (
            <div className="checkout-result-details">
              <p>
                Thank you, <strong>{session.customer_name || session.customer_email}</strong>!
                Your order has been confirmed.
              </p>
              {session.has_digital && (
                <div className="checkout-result-box">
                  <h2>📧 Digital maps on their way</h2>
                  <p>
                    Download links for your digital maps have been sent to{" "}
                    <strong>{session.customer_email}</strong>. Check your inbox (and spam folder).
                  </p>
                </div>
              )}
              {session.has_physical && (
                <div className="checkout-result-box">
                  <h2>📦 Book order received</h2>
                  <p>
                    Your physical book will be packed and shipped to the address you provided.
                    You'll receive a shipping notification by email.
                  </p>
                </div>
              )}
              <p className="checkout-result-ref">
                Order reference: <code>{sessionId}</code>
              </p>
            </div>
          )}

          {!loading && !session && !error && (
            <p>Your payment has been received. Check your email for download links or shipping confirmation.</p>
          )}

          {error && <p className="cart-error">{error}</p>}

          <Link className="button button-secondary" to="/shop">Back to Shop</Link>
        </div>
      </main>
    </div>
  );
}
