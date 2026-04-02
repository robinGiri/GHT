import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Breadcrumb from "../components/Breadcrumb";
import { Lotus } from "../components/NepaliIcons";

export default function OrderCancel() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main id="main-content" className="checkout-result-main">
        <div className="container checkout-result-inner">
          <Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: "Payment Cancelled" }]} />
          <div className="checkout-result-icon checkout-result-icon--cancel" aria-hidden="true">✕</div>
          <h1 className="checkout-result-title">Payment cancelled</h1>
          <p>No charge was made. Your cart items are still saved — you can try again any time.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
            <Link className="button button-primary" to="/shop">Return to Shop</Link>
            <Link className="button button-secondary" to="/">Back to Home</Link>
          </div>
        </div>
      </main>
      <div className="lotus-divider" aria-hidden="true"><Lotus size={56} /></div>
      <SiteFooter />
    </div>
  );
}
