import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CartIcon from "./CartIcon";
import CartDrawer from "./CartDrawer";

const NAV_LINKS = [
  { label: "Journeys", to: "/journeys" },
  { label: "Plan",     to: "/plan" },
  { label: "Culture",  to: "/culture" },
  { label: "Shop",     to: "/shop" },
];

export default function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  const closeNav = () => setNavOpen(false);

  return (
    <>
      <CartDrawer />
      <header className={`site-header${navOpen ? " nav-is-open" : ""}`}>
        {/* Brand */}
        <Link
          className="brand"
          to="/"
          aria-label="Great Himalaya Trail — home"
          onClick={closeNav}
        >
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-copy">
            <strong>Great Himalaya Trail</strong>
            <small>Nepal</small>
          </span>
        </Link>

        {/* Primary nav */}
        <nav
          className={`site-nav${navOpen ? " is-open" : ""}`}
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className={pathname === to || pathname.startsWith(to + "/") ? "is-active" : ""}
              onClick={closeNav}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions: cart + hamburger */}
        <div className="header-actions">
          <CartIcon />
          <button
            className="nav-toggle"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            onClick={() => setNavOpen((p) => !p)}
          >
            <span className="nav-toggle-bar" aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  );
}
