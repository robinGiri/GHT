import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>Great Himalaya Trail</strong>
          <span>Nepal</span>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
        </nav>
        <p className="footer-copy">1,700 km across the roofline of Nepal.</p>
      </div>
    </footer>
  );
}
