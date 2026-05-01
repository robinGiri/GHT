import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function NotFoundPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main id="main-content" style={{ padding: "6rem 2rem", textAlign: "center", minHeight: "60vh" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 900, color: "var(--ink)" }}>404</h1>
        <p style={{ fontSize: "1.15rem", color: "#555", margin: "1rem 0 2rem" }}>
          This trail doesn't exist — yet. Let's get you back on the path.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="button button-primary" to="/">Home</Link>
          <Link className="button button-secondary" to="/shop">Shop Maps</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
