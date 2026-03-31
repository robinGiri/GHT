import { useCart } from "../context/CartContext";

export default function MapProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <article className="map-card">
      <div className="map-card-header">
        <span className="map-card-code">{product.mapCode}</span>
        {product.badge && (
          <span className="map-card-badge">{product.badge}</span>
        )}
      </div>
      <h3 className="map-card-name">{product.name}</h3>
      <div className="map-card-meta">
        <span className="map-card-region">{product.region}</span>
        {product.scale && (
          <span className="map-card-scale">Scale {product.scale}</span>
        )}
      </div>
      <p className="map-card-file">{product.fileLabel}</p>
      <div className="map-card-footer">
        <strong className="map-card-price">${product.price.toFixed(2)}</strong>
        <button
          className="button button-primary map-card-btn"
          onClick={() => addItem(product)}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
