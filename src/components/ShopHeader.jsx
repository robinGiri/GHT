import { useState } from "react";
import { Link } from "react-router-dom";
import CartIcon from "./CartIcon";
import CartDrawer from "./CartDrawer";

export default function ShopHeader() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <CartDrawer />
      <header className={`site-header shop-header${navOpen ? " nav-is-open" : ""}`}>
        <div className="header-row">
          <Link className="brand" to="/" aria-label="Great Himalaya Trail Nepal">
            <span className="brand-mark"></span>
            <span className="brand-copy">
              <strong>Great Himalaya Trail</strong>
              <small>Nepal</small>
            </span>
          </Link>
          <CartIcon />
          <button
            className="nav-toggle"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((p) => !p)}
          >
            <span className="nav-toggle-bar" />
          </button>
        </div>
        <nav
          className={`site-nav${navOpen ? " is-open" : ""}`}
          aria-label="Primary"
          onClick={() => setNavOpen(false)}
        >
          <Link to="/">Home</Link>
          <Link to="/shop" className="nav-shop-link">Shop</Link>
        </nav>
      </header>
    </>
  );
}
