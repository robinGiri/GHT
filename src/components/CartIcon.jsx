import { useCart } from "../context/CartContext";

export default function CartIcon() {
  const { itemCount, setDrawerOpen } = useCart();

  return (
    <button
      className="cart-icon-btn"
      aria-label={`Shopping cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
      onClick={() => setDrawerOpen(true)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {itemCount > 0 && (
        <span className="cart-badge" aria-hidden="true">{itemCount > 9 ? "9+" : itemCount}</span>
      )}
    </button>
  );
}
