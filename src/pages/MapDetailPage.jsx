import { useParams, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Breadcrumb from "../components/Breadcrumb";
import { Lotus } from "../components/NepaliIcons";
import { useCart } from "../context/CartContext";
import { getProductById, MAPS } from "../data/products";

export default function MapDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const product = getProductById(id);

  if (!product) {
    return (
      <div className="page-shell">
        <SiteHeader />
        <main id="main-content" className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
          <p className="eyebrow">404</p>
          <h1>Map not found</h1>
          <Link className="button button-secondary" to="/shop">Back to Shop</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main id="main-content" className="map-detail-main">
        <div className="container map-detail-inner">
          {/* Breadcrumb */}
          <Breadcrumb items={[{ label: "Shop", to: "/shop" }, { label: product.name }]} />

          <div className="map-detail-grid">
            {/* Left: info */}
            <div className="map-detail-info">
              <div className="map-detail-codes">
                <span className="map-card-code">{product.mapCode}</span>
                {product.badge && <span className="map-card-badge">{product.badge}</span>}
                <span className="map-detail-updated">Updated {product.updated}</span>
              </div>
              <h1 className="map-detail-title">{product.name}</h1>
              <p className="map-detail-desc">{product.description}</p>

              {/* Coverage */}
              {product.coverage && (
                <div className="map-detail-coverage">
                  <h2 className="map-detail-sub">Key areas covered</h2>
                  <ul className="map-detail-coverage-list">
                    {product.coverage.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bundle includes */}
              {product.includes && (
                <div className="map-detail-coverage">
                  <h2 className="map-detail-sub">Included maps</h2>
                  <ul className="map-detail-coverage-list">
                    {product.includes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="map-detail-specs">
                {product.scale && (
                  <div className="map-detail-spec">
                    <span className="map-detail-spec-label">Scale</span>
                    <span>{product.scale}</span>
                  </div>
                )}
                <div className="map-detail-spec">
                  <span className="map-detail-spec-label">Format</span>
                  <span>{product.fileLabel}</span>
                </div>
                <div className="map-detail-spec">
                  <span className="map-detail-spec-label">Region</span>
                  <span>{product.region}</span>
                </div>
                <div className="map-detail-spec">
                  <span className="map-detail-spec-label">SKU</span>
                  <span>{product.sku}</span>
                </div>
              </div>
            </div>

            {/* Right: purchase box */}
            <aside className="map-detail-buy">
              <div className="map-detail-buy-card">
                <strong className="map-detail-price">${product.price.toFixed(2)}</strong>
                <p className="map-detail-delivery">
                  🗺️ Digital PDF delivered by email immediately after payment.
                </p>
                <button
                  className="button button-primary map-detail-btn"
                  onClick={() => addItem(product)}
                >
                  Add to Cart — ${product.price.toFixed(2)}
                </button>
                <ul className="map-detail-trust">
                  <li>✓ Secure payment via Stripe</li>
                  <li>✓ Instant email delivery</li>
                  <li>✓ High-resolution PDF</li>
                  <li>✓ Updated {product.updated}</li>
                </ul>
                <Link className="map-detail-back" to="/shop">← All maps</Link>
              </div>
            </aside>
          </div>

          {/* Prev / Next map navigation */}
          {(() => {
            const idx = MAPS.findIndex((m) => m.id === product.id);
            if (idx === -1) return null;
            const prev = idx > 0 ? MAPS[idx - 1] : null;
            const next = idx < MAPS.length - 1 ? MAPS[idx + 1] : null;
            return (
              <nav className="map-prev-next" aria-label="Adjacent maps">
                {prev ? (
                  <Link to={`/shop/maps/${prev.id}`} className="map-prev-next-link">
                    <span className="map-prev-next-dir">← Previous</span>
                    <span className="map-prev-next-name">{prev.name.replace("GHT Digital Map — ", "")}</span>
                  </Link>
                ) : <span />}
                {next ? (
                  <Link to={`/shop/maps/${next.id}`} className="map-prev-next-link map-prev-next-link--next">
                    <span className="map-prev-next-dir">Next →</span>
                    <span className="map-prev-next-name">{next.name.replace("GHT Digital Map — ", "")}</span>
                  </Link>
                ) : <span />}
              </nav>
            );
          })()}
        </div>
      </main>
      <div className="lotus-divider" aria-hidden="true"><Lotus size={56} /></div>
      <SiteFooter />
    </div>
  );
}
