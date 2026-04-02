import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Breadcrumb from "../components/Breadcrumb";
import MapProductCard from "../components/MapProductCard";
import BookCard from "../components/BookCard";
import { useCart } from "../context/CartContext";
import { MAPS, MAP_BUNDLE, BOOK, DONATION } from "../data/products";

const TABS = ["Maps", "Books", "Donate"];
const TAB_KEY = "tab";

const REGION_FILTERS = [
  { label: "All Regions", value: "all" },
  { label: "Far East", value: "far-east" },
  { label: "Khumbu", value: "khumbu" },
  { label: "Central", value: "central" },
  { label: "Western Wilds", value: "western-wilds" },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get(TAB_KEY);
  const tab = TABS.find((t) => t.toLowerCase() === tabParam?.toLowerCase()) || "Maps";
  const setTab = (t) => setSearchParams((prev) => { prev.set(TAB_KEY, t.toLowerCase()); return prev; }, { replace: true });
  const [regionFilter, setRegionFilter] = useState("all");
  const { addItem } = useCart();
  const [donationAmt, setDonationAmt] = useState(10);
  const [customAmt, setCustomAmt] = useState("");
  const [donateAdded, setDonateAdded] = useState(false);

  const filteredMaps = regionFilter === "all"
    ? MAPS
    : MAPS.filter((m) => m.regionTag === regionFilter);

  function handleDonate(e) {
    e.preventDefault();
    const amt = customAmt ? parseFloat(customAmt) : donationAmt;
    if (!amt || amt < 1) return;
    addItem({ ...DONATION, price: amt, name: `Donation to the GHT ($${amt})` });
    setDonateAdded(true);
    setTimeout(() => setDonateAdded(false), 2500);
  }

  return (
    <div className="page-shell">
      <SiteHeader />

      <main id="main-content" className="shop-main">
        <section className="page-hero shop-hero">
          <div className="page-hero-img" aria-hidden="true">
            <img src="/images/belt-nepal.jpg" alt="" />
          </div>
          <div className="page-hero-inner">
            <Breadcrumb items={[{ label: "Shop" }]} />
            <p className="eyebrow">GHT Shop</p>
            <h1>Maps, Guides & More</h1>
            <p>
              High-resolution digital maps and the definitive GHT trekking guide — everything you need to plan and navigate the Great Himalaya Trail.
            </p>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        {/* Tab navigation */}
        <div className="shop-tabs-bar">
          <div className="container">
            <div className="shop-tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={`shop-tab${tab === t ? " shop-tab--active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container shop-content">
          {/* ── Maps tab ── */}
          {tab === "Maps" && (
            <section aria-labelledby="maps-heading">
              <h2 id="maps-heading" className="shop-section-title">Digital Trekking Maps</h2>
              <p className="shop-section-desc">
                High-resolution PDF maps at 1:100,000 scale. Delivered by email immediately after purchase. Updated {new Date().getFullYear()}.
              </p>

              {/* Region filter */}
              <div className="shop-filters" role="group" aria-label="Filter by region">
                {REGION_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    className={`shop-filter-chip${regionFilter === f.value ? " shop-filter-chip--active" : ""}`}
                    onClick={() => setRegionFilter(f.value)}
                    aria-pressed={regionFilter === f.value}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="maps-grid">
                {filteredMaps.map((map) => (
                  <Link key={map.id} to={`/shop/maps/${map.id}`} className="map-card-link">
                    <MapProductCard product={map} />
                  </Link>
                ))}
              </div>

              {/* Bundle */}
              <div className="bundle-card">
                <div className="bundle-card-header">
                  <span className="bundle-badge">Best Value</span>
                  <h3 className="bundle-title">{MAP_BUNDLE.name}</h3>
                </div>
                <p className="bundle-desc">{MAP_BUNDLE.description}</p>
                <details className="bundle-includes-toggle">
                  <summary>What's included ({MAP_BUNDLE.includes.length} maps)</summary>
                  <ul className="bundle-includes-list">
                    {MAP_BUNDLE.includes.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </details>
                <div className="bundle-footer">
                  <strong className="bundle-price">${MAP_BUNDLE.price.toFixed(2)}</strong>
                  <span className="bundle-file">{MAP_BUNDLE.fileLabel}</span>
                  <button
                    className="button button-primary"
                    onClick={() => addItem(MAP_BUNDLE)}
                  >
                    Add Bundle to Cart
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── Books tab ── */}
          {tab === "Books" && (
            <section aria-labelledby="books-heading">
              <h2 id="books-heading" className="shop-section-title">Trekking Guide Book</h2>
              <p className="shop-section-desc">
                The only comprehensive planning and route guide for the entire GHT in Nepal. Worldwide shipping included.
              </p>
              <BookCard product={BOOK} />
            </section>
          )}

          {/* ── Donate tab ── */}
          {tab === "Donate" && (
            <section aria-labelledby="donate-heading" className="donate-section">
              <h2 id="donate-heading" className="shop-section-title">Support the Trail</h2>
              <p className="shop-section-desc">
                Your donation supports trail maintenance, local community initiatives, and conservation along the 1,700 km of the Great Himalaya Trail.
              </p>
              <form className="donate-form" onSubmit={handleDonate}>
                <fieldset>
                  <legend className="donate-legend">Select an amount</legend>
                  <div className="donate-amounts">
                    {[10, 25, 50, 100].map((amt) => (
                      <label key={amt} className={`donate-amount-label${donationAmt === amt && !customAmt ? " donate-amount-label--active" : ""}`}>
                        <input
                          type="radio"
                          name="donation"
                          value={amt}
                          checked={donationAmt === amt && !customAmt}
                          onChange={() => { setDonationAmt(amt); setCustomAmt(""); }}
                        />
                        ${amt}
                      </label>
                    ))}
                  </div>
                  <div className="donate-custom">
                    <label htmlFor="custom-amount">Or enter a custom amount</label>
                    <div className="donate-custom-input">
                      <span>$</span>
                      <input
                        id="custom-amount"
                        type="number"
                        min="1"
                        step="1"
                        value={customAmt}
                        onChange={(e) => setCustomAmt(e.target.value)}
                        placeholder="e.g. 30"
                      />
                    </div>
                  </div>
                </fieldset>
                <button type="submit" className="button button-primary donate-btn" disabled={donateAdded}>
                  {donateAdded ? "Added to cart ✓" : `Donate $${customAmt || donationAmt}`}
                </button>
              </form>
            </section>
          )}
        </div>
      </main>

      <div className="lotus-divider" aria-hidden="true"><div className="lotus-divider-icon" /></div>
      <SiteFooter />
    </div>
  );
}
