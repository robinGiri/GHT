import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Breadcrumb from "../components/Breadcrumb";
import { Lotus } from "../components/NepaliIcons";

function DownloadButton({ url, label }) {
  return (
    <a
      href={url}
      className="download-btn"
      download
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1v10M8 11l-3-3M8 11l3-3M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </a>
  );
}

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

  const digitalItems = session?.items?.filter(i => i.product_type === "digital_map") || [];

  return (
    <div className="page-shell">
      <SiteHeader />
      <main id="main-content" className="checkout-result-main">
        <div className="container checkout-result-inner">
          <Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: "Order Confirmation" }]} />
          <div className="checkout-result-icon checkout-result-icon--success" aria-hidden="true">✓</div>
          <h1 className="checkout-result-title">Payment successful!</h1>

          {loading && <p>Loading order details…</p>}

          {!loading && session && (
            <div className="checkout-result-details">
              <p>
                Thank you, <strong>{session.customer_name || session.customer_email}</strong>!
                Your order has been confirmed.
              </p>

              {/* Digital downloads section */}
              {digitalItems.length > 0 && (
                <div className="checkout-result-box downloads-box">
                  <h2>🗺️ Your Digital Maps</h2>
                  <p className="downloads-subtitle">
                    Download your maps below. Links are valid for 24 hours.
                  </p>
                  <div className="downloads-grid">
                    {digitalItems.map((item) =>
                      item.download_urls ? (
                        /* Bundle: list all maps */
                        <div key={item.product_id} className="download-card download-card--bundle">
                          <h3>{item.product_name}</h3>
                          <div className="bundle-downloads">
                            {item.download_urls.map((dl) => (
                              <DownloadButton
                                key={dl.map_code}
                                url={dl.url}
                                label={`${dl.map_code}.pdf`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Single map */
                        <div key={item.product_id} className="download-card">
                          <h3>{item.product_name}</h3>
                          <DownloadButton
                            url={item.download_url}
                            label="Download PDF Map"
                          />
                        </div>
                      )
                    )}
                  </div>
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
      <div className="lotus-divider" aria-hidden="true"><Lotus size={56} /></div>
      <SiteFooter />
    </div>
  );
}
