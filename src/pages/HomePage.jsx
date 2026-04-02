import { useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { Mandala, Lotus, Stupa, EndlessKnot, Dorje, MountainRange } from "../components/NepaliIcons";

const beltZones = [
  {
    id: "pk",
    region: "Pakistan / Karakoram",
    country: "Pakistan",
    anchor: "Nanga Parbat · 8,126 m",
    image: "/images/belt-pakistan.jpg",
    elevation: "8,611 m (K2)",
    kmShare: 8,
    access: "Open",
    season: "Jun – Aug",
    highlight: "Home to K2 and the most glaciated non-polar region on Earth — 18 summits above 7,500 m compressed into 500 km.",
    treks: ["K2 Base Camp (12 d)", "Fairy Meadows (3 d)", "Snow Lake Traverse"],
    color: "#d4613a",
    isNepal: false,
  },
  {
    id: "in-w",
    region: "India West / Ladakh",
    country: "India",
    anchor: "Stok Kangri · 6,153 m",
    image: "/images/belt-ladakh.jpg",
    elevation: "6,153 m",
    kmShare: 6,
    access: "Inner Line Permit",
    season: "Jun – Sep",
    highlight: "High-altitude desert plateaus, ancient Buddhist monasteries, and the frozen Zanskar river winter route — the Chadar trek.",
    treks: ["Markha Valley (9 d)", "Chadar – Frozen River (9 d)", "Stok Kangri Summit"],
    color: "#d4832a",
    isNepal: false,
  },
  {
    id: "np",
    region: "Nepal",
    country: "Nepal",
    anchor: "Kanchenjunga · 8,586 m",
    image: "/images/belt-nepal.jpg",
    elevation: "8,849 m (Everest)",
    kmShare: 20,
    access: "TIMS + Permits",
    season: "Oct – Nov / Mar – May",
    highlight: "The heart of the arc — 1,700 km threading nine distinct regions, from cardamom subtropical valleys to 5,000 m glacial passes.",
    treks: ["Full GHT (150 d)", "Kanchenjunga Circuit", "Everest Three Passes", "Manaslu Circuit", "Upper Dolpo"],
    color: "#2D5F52",
    isNepal: true,
  },
  {
    id: "in-e",
    region: "India East / Sikkim",
    country: "India",
    anchor: "Kanchenjunga SW · 8,586 m",
    image: "/images/belt-sikkim.jpg",
    elevation: "8,586 m",
    kmShare: 4,
    access: "Protected Area Permit",
    season: "Oct – Nov / Apr – May",
    highlight: "The Sikkim Himalaya — Goecha La viewpoint faces the world's third-highest peak across a glacial cirque at 4,940 m.",
    treks: ["Goecha La (11 d)", "Green Lake Trek (9 d)"],
    color: "#40956d",
    isNepal: false,
  },
  {
    id: "bt",
    region: "Bhutan",
    country: "Bhutan",
    anchor: "Gangkhar Puensum · 7,570 m",
    image: "/images/belt-bhutan.jpg",
    elevation: "7,570 m",
    kmShare: 7,
    access: "Guided + Govt Fee",
    season: "Sep – Nov / Mar – May",
    highlight: "Bhutan's Snowman Trek is among the world's hardest — 347 km through Lunana, crossing 11 passes above 5,000 m in 25–30 days.",
    treks: ["Snowman Trek (25-30 d)", "Jomolhari Trek (8 d)", "Druk Path (6 d)"],
    color: "#3472a4",
    isNepal: false,
  },
  {
    id: "cn",
    region: "Tibet / Eastern Anchor",
    country: "China (Tibet)",
    anchor: "Namche Barwa · 7,782 m",
    image: "/images/belt-tibet.jpg",
    elevation: "7,782 m",
    kmShare: 5,
    access: "Restricted",
    season: "Apr – Oct",
    highlight: "Namche Barwa anchors the eastern end of the arc inside the Yarlung Tsangpo Grand Canyon — the world's deepest gorge at 5,382 m.",
    treks: ["Yarlung Tsangpo Canyon (guided)", "Namche Barwa Base Camp"],
    color: "#10242d",
    isNepal: false,
  },
];

function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );
    const revealItems = document.querySelectorAll(".reveal");
    revealItems.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 80, 400)}ms`;
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      document.body.classList.remove("js-enhanced");
    };
  }, []);

  return (
    <div className="page-shell">
      <SiteHeader />

      <main id="main-content">
        <section className="page-hero home-hero">
          <div className="page-hero-img" aria-hidden="true">
            <img src="/images/hero-sunset.jpg" alt="" />
          </div>
          <div className="page-hero-inner hero-copy reveal">
            <p className="eyebrow">High routes. Deep valleys. Human scale wonder.</p>
            <h1>The roofline of Nepal, translated into a modern journey.</h1>
            <p className="hero-text">
              The Great Himalaya Trail threads through glacier basins, wind-cut passes, Sherpa
              villages, hidden monasteries, and forests that drop toward subtropical river gorges.
              This is not one trail. It is a continent of footsteps.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/plan">
                Start Planning
              </Link>
              <a className="button button-secondary" href="#regions">
                See Regions
              </a>
            </div>
            <ul className="hero-stats" aria-label="Trail stats">
              <li>
                <strong>1,700 km</strong>
                <span>across Nepal's mountain spine</span>
              </li>
              <li>
                <strong>10+ regions</strong>
                <span>each with distinct terrain and culture</span>
              </li>
              <li>
                <strong>4 seasons</strong>
                <span>with spring and autumn at their most luminous</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Page-scroll sub-nav ── */}
        <nav className="page-scroll-nav" aria-label="Page sections">
          <a href="#story">Story</a>
          <a href="#regions">Regions</a>
          <a href="#belt">The Belt</a>
          <a href="#explore">Explore</a>
          <a href="#booking">Contact</a>
        </nav>

        <section className="story-section reveal" id="story">
          <Mandala size={80} className="section-mandala" />
          <div className="section-heading">
            <p className="eyebrow">Why it matters</p>
            <h2>A trail defined by contrast rather than distance alone.</h2>
          </div>
          <div className="story-hero-banner reveal">
            <img src="/images/story-trail.jpg" alt="Trekker crossing a vast mountain landscape" loading="lazy" />
          </div>
          <div className="story-grid">
            <article className="story-panel accent-panel">
              <p>
                Nepal's Great Himalaya Trail is compelling because every few days the visual grammar
                changes: icefields become yak pasture, juniper smoke gives way to rhododendron
                forest, and fortress villages open into broad Buddhist valleys.
              </p>
            </article>
            <article className="story-panel">
              <h3>Culture is the route</h3>
              <p>
                The trail is shaped by Tamang, Sherpa, Thakali, Gurung, Rai, and
                Tibetan-influenced communities whose architecture, food, and ritual mark each stage
                as distinctly as the mountains do.
              </p>
            </article>
            <article className="story-panel">
              <h3>Landscape at full scale</h3>
              <p>
                From Kanchenjunga to Darchula, the route reveals Nepal as a sequence of climatic
                worlds stacked vertically into one country.
              </p>
            </article>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="belt-section reveal" id="belt">
          <div className="section-heading">
            <p className="eyebrow">The Himalayan Arc</p>
            <h2>Nepal sits at the heart of a 4,500 km mountain corridor.</h2>
          </div>
          <p className="belt-lead">
            The Great Himalaya Trail is part of a continuous high-altitude arc stretching from
            Nanga Parbat in Pakistan to Namche Barwa in Tibet — threading through six countries,
            carrying some of the highest, hardest, and most culturally layered terrain on Earth.
            Nepal holds the longest and most accessible share. But the ranges on either side
            complete the picture.
          </p>

          <div className="belt-track-wrap" aria-label="Himalayan Arc proportional map">
            <div className="belt-track">
              {beltZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`belt-track-segment${zone.isNepal ? " is-nepal" : ""}`}
                  style={{ flex: zone.kmShare, background: zone.color }}
                  title={zone.region}
                />
              ))}
            </div>
            <div className="belt-track-ends">
              <span>← Nanga Parbat · Pakistan</span>
              <span>Namche Barwa · Tibet →</span>
            </div>
          </div>

          <div className="belt-grid">
            {beltZones.map((zone) => (
              <article
                key={zone.id}
                className={`belt-card glass-panel${zone.isNepal ? " belt-card--focus" : ""}`}
                style={{ "--zone-color": zone.color }}
              >
                <div className="belt-card-img">
                  <img src={zone.image} alt={zone.region} loading="lazy" />
                </div>
                <div className="belt-card-header">
                  <span className="belt-country">{zone.country}</span>
                  <span
                    className="belt-access-pill"
                    style={{ background: zone.isNepal ? "var(--forest)" : "rgba(255,255,255,0.08)" }}
                  >
                    {zone.access}
                  </span>
                </div>
                <h3 className="belt-region">{zone.region}</h3>
                <p className="belt-anchor">{zone.anchor}</p>
                <p className="belt-highlight">{zone.highlight}</p>
                <div className="belt-meta">
                  <span><strong>Season</strong> {zone.season}</span>
                  <span><strong>High point</strong> {zone.elevation}</span>
                </div>
                <ul className="belt-treks">
                  {zone.treks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="regions-section" id="regions">
          <div className="section-heading reveal">
            <p className="eyebrow">Regions</p>
            <h2>Four signatures of the trail.</h2>
          </div>
          <div className="regions-grid">
            <article className="region-card reveal">
              <div className="region-card-img">
                <img src="/images/region-eastern.jpg" alt="Snow-capped peaks of eastern Nepal" loading="lazy" />
              </div>
              <div className="region-card-body">
                <span className="region-index">01</span>
                <h3>Eastern Frontier</h3>
                <p>
                  Kanchenjunga and Makalu country, where giant walls rise above cardamom hills and
                  village trails feel exploratory.
                </p>
              </div>
            </article>
            <article className="region-card reveal">
              <div className="region-card-img">
                <img src="/images/region-khumbu.jpg" alt="Ama Dablam peak in the Khumbu region" loading="lazy" />
              </div>
              <div className="region-card-body">
                <span className="region-index">02</span>
                <h3>Khumbu Heights</h3>
                <p>
                  Ice, monasteries, suspension bridges, and a skyline crowned by Everest, Lhotse, and
                  Ama Dablam.
                </p>
              </div>
            </article>
            <article className="region-card reveal">
              <div className="region-card-img">
                <img src="/images/region-central.jpg" alt="Machapuchare and the Annapurna range" loading="lazy" />
              </div>
              <div className="region-card-body">
                <span className="region-index">03</span>
                <h3>Central Classics</h3>
                <p>
                  Langtang, Manaslu, and Annapurna bring dramatic access to high passes, deep
                  villages, and iconic tea-house rhythm.
                </p>
              </div>
            </article>
            <article className="region-card reveal">
              <div className="region-card-img">
                <img src="/images/region-western.jpg" alt="Remote mountain valley in western Nepal" loading="lazy" />
              </div>
              <div className="region-card-body">
                <span className="region-index">04</span>
                <h3>Western Wilds</h3>
                <p>
                  Dolpo, Jumla, and Humla expand into quiet plateaus, turquoise lakes, and some of
                  Nepal's most remote cultural landscapes.
                </p>
              </div>
            </article>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="topic-teasers" id="explore">
          <div className="section-heading reveal">
            <p className="eyebrow">Explore deeper</p>
            <h2>Three ways to go further.</h2>
          </div>
          <div className="topic-teasers-grid">
            <article className="topic-teaser-card glass-panel reveal">
              <div className="topic-teaser-img">
                <img src="/images/teaser-journeys.jpg" alt="Autumn valley with Himalayan mountains" loading="lazy" />
              </div>
              <div className="topic-teaser-title-row">
                <div className="topic-teaser-icon" aria-hidden="true"><EndlessKnot size={40} /></div>
                <h3>Journeys</h3>
              </div>
              <p>
                Nine regional sections from Kanchenjunga to Humla — each with full route
                breakdowns, altitude profiles, and stage-by-stage detail for every major trek.
              </p>
              <Link to="/journeys" className="button button-secondary">
                Explore Journeys →
              </Link>
            </article>
            <article className="topic-teaser-card glass-panel reveal">
              <div className="topic-teaser-img">
                <img src="/images/teaser-plan.jpg" alt="Mountain pass view from trail" loading="lazy" />
              </div>
              <div className="topic-teaser-title-row">
                <div className="topic-teaser-icon" aria-hidden="true"><Dorje size={56} /></div>
                <h3>Plan Your Trip</h3>
              </div>
              <p>
                Route lengths, season windows, permit costs, budget ranges, essential gear lists,
                altitude protocol, and emergency planning — in one place.
              </p>
              <Link to="/plan" className="button button-secondary">
                Start Planning →
              </Link>
            </article>
            <article className="topic-teaser-card glass-panel reveal">
              <div className="topic-teaser-img">
                <img src="/images/teaser-culture.jpg" alt="Buddhist monastery on Himalayan mountainside" loading="lazy" />
              </div>
              <div className="topic-teaser-title-row">
                <div className="topic-teaser-icon" aria-hidden="true"><Stupa size={44} /></div>
                <h3>Culture &amp; Environment</h3>
              </div>
              <p>
                Eight ethnic communities, five trail festivals, eight protected areas, and the
                wildlife and conservation principles that make responsible trekking matter.
              </p>
              <Link to="/culture" className="button button-secondary">
                Discover Culture →
              </Link>
            </article>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="page-hero booking-section" id="booking">
          <div className="page-hero-inner booking-inner reveal">
            <p className="eyebrow">For Operators &amp; Partners</p>
            <h2>Build GHT itineraries with local expertise.</h2>
            <p className="booking-desc">
              We work with licensed trekking agencies, international tour operators, and travel
              designers to build fully permitted, logistically sound Great Himalaya Trail packages
              — from single-region immersions to full east-west traverses.
            </p>
            <div className="booking-points">
              <div className="booking-point">
                <strong>Permit Handling</strong>
                <p>Restricted area permits, TIMS, national park entries — filed and confirmed before departure.</p>
              </div>
              <div className="booking-point">
                <strong>Custom Itineraries</strong>
                <p>Region combinations, difficulty calibration, acclimatization scheduling tailored to your group profile.</p>
              </div>
              <div className="booking-point">
                <strong>Local Operations</strong>
                <p>Licensed guides, porter teams, camping logistics, helicopter standby, and emergency coordination.</p>
              </div>
            </div>
            <a className="button button-primary" href="mailto:info@greathimalayatrail.com">
              Partner With Us
            </a>
          </div>
        </section>
      </main>

      <div className="lotus-divider" aria-hidden="true"><Lotus size={56} /></div>
      <SiteFooter />
    </div>
  );
}

export default HomePage;
