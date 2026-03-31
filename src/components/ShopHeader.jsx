import { Link } from "react-router-dom";
import CartIcon from "./CartIcon";
import CartDrawer from "./CartDrawer";

export default function ShopHeader() {
  return (
    <>
      <CartDrawer />
      <header className="site-header shop-header">
        <div className="header-row">
          <Link className="brand" to="/" aria-label="Great Himalaya Trail Nepal">
            <span className="brand-mark"></span>
            <span className="brand-copy">
              <strong>Great Himalaya Trail</strong>
              <small>Nepal</small>
            </span>
          </Link>
          <nav className="site-nav" aria-label="Primary">
            <Link to="/">Home</Link>
            <Link to="/shop" className="nav-shop-link">Shop</Link>
          </nav>
          <CartIcon />
        </div>
      </header>
    </>
  );
}
