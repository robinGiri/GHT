import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import CartIcon from "./CartIcon";

const NAV_LINKS = [
  { label: "Journeys", to: "/journeys" },
  { label: "Plan",     to: "/plan" },
  { label: "Culture",  to: "/culture" },
  { label: "Shop",     to: "/shop" },
];

export default function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef(null);
  const toggleRef = useRef(null);
  const { pathname } = useLocation();

  const closeNav = useCallback(() => setNavOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!navOpen) return;
    function onKey(e) {
      if (e.key === "Escape") {
        setNavOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  // Close on route change
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Trap focus inside mobile nav when open
  useEffect(() => {
    if (!navOpen || !navRef.current) return;
    const nav = navRef.current;
    const focusable = nav.querySelectorAll("a, button");
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function trap(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    nav.addEventListener("keydown", trap);
    first.focus();
    return () => nav.removeEventListener("keydown", trap);
  }, [navOpen]);

  return (
    <header className={`site-header${navOpen ? " nav-is-open" : ""}`}>
      {/* Brand */}
      <NavLink
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
      </NavLink>

      {/* Primary nav */}
      <nav
        ref={navRef}
        className={`site-nav${navOpen ? " is-open" : ""}`}
        id="primary-nav"
        aria-label="Primary navigation"
      >
        {NAV_LINKS.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? "is-active" : ""}
            aria-current={pathname === to || pathname.startsWith(to + "/") ? "page" : undefined}
            onClick={closeNav}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Actions: cart + hamburger */}
      <div className="header-actions">
        <CartIcon />
        <button
          ref={toggleRef}
          className="nav-toggle"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          aria-controls="primary-nav"
          onClick={() => setNavOpen((p) => !p)}
        >
          <span className="nav-toggle-bar" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile backdrop */}
      {navOpen && (
        <div
          className="nav-backdrop"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
