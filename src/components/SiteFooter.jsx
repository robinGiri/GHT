import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      {/* Lotus divider */}
      <div className="lotus-divider" aria-hidden="true">
        <div className="lotus-divider-icon" />
      </div>

      <div className="footer-inner">
        <div className="footer-brand">
          {/* Stupa icon */}
          <span className="stupa-icon" aria-hidden="true">
            <span className="stupa-spire" />
            <span className="stupa-dome" />
            <span className="stupa-base-upper" />
            <span className="stupa-base-lower" />
            <span className="stupa-plinth" />
          </span>
          <strong>Great Himalaya Trail</strong>
          <span>Nepal</span>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
        </nav>
        <div>
          {/* Marigold garland (Tihar dots) */}
          <div className="marigold-garland" aria-hidden="true">
            <span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span />
            <span /><span />
          </div>
          <p className="footer-copy">1,700 km across the roofline of Nepal.</p>
        </div>
      </div>
    </footer>
  );
}
