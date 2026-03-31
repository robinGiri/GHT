import { useCart } from "../context/CartContext";

export default function BookCard({ product }) {
  const { addItem } = useCart();

  return (
    <article className="book-card">
      <div className="book-card-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Physical book — ships worldwide
      </div>
      <h3 className="book-card-name">{product.name}</h3>
      <p className="book-card-desc">{product.description}</p>
      <ul className="book-card-includes">
        {product.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="book-card-specs">
        <span>ISBN {product.isbn}</span>
        <span>{product.weight}</span>
      </div>
      <div className="book-card-footer">
        <div>
          <strong className="book-card-price">${product.price.toFixed(2)}</strong>
          <span className="book-card-shipping">{product.shipping}</span>
        </div>
        <button
          className="button button-primary"
          onClick={() => addItem(product)}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
