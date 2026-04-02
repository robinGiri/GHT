import { useEffect, useState, useRef } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Breadcrumb from "../components/Breadcrumb";

const SECTIONS = [
  { id: "culture", label: "People & Culture" },
  { id: "environment", label: "Environment" },
];

const cultureData = {
  peoples: [
    { name: "Sherpa", region: "Khumbu, Rolwaling", note: "Buddhist mountaineering culture, monasteries, Mani Rimdu festival" },
    { name: "Rai & Limbu", region: "Eastern Nepal", note: "Kirant animist traditions, Mundhum oral literature, cardamom farmers" },
    { name: "Tamang", region: "Langtang, Helambu", note: "Tibeto-Burman language, stone-roofed villages, Tamang Selo music" },
    { name: "Gurung", region: "Annapurna, Manaslu", note: "Former Gurkha soldiers, Rodhi communal halls, honey hunters" },
    { name: "Thakali", region: "Kali Gandaki valley", note: "Historic salt traders, renowned cuisine, prosperous lodges" },
    { name: "Dolpo-pa", region: "Dolpo", note: "Ancient Bön Buddhist traditions, yak caravans, Crystal Mountain pilgrimage" },
    { name: "Magar", region: "Western hills", note: "Nepal's largest ethnic group in western regions, Barha Magarat kingdom heritage" },
    { name: "Loba", region: "Upper Mustang", note: "Tibetan kingdom of Lo, walled city of Lo Manthang, cave monasteries" },
  ],
  festivals: [
    { name: "Dashain", timing: "Oct", desc: "Nepal's largest festival — 15 days of family reunion, kite flying, and animal offerings" },
    { name: "Tihar", timing: "Oct–Nov", desc: "Festival of lights honoring Laxmi — oil lamps, marigolds, and Deusi-Bhailo singing" },
    { name: "Losar", timing: "Feb–Mar", desc: "Tibetan-Buddhist new year celebrated in Sherpa, Tamang, and Gurung communities" },
    { name: "Mani Rimdu", timing: "Oct–Nov", desc: "Sherpa monastery festival with masked dances at Tengboche, Thame, and Chiwong" },
    { name: "Tiji Festival", timing: "May", desc: "Three-day horse festival in Lo Manthang — monks perform masked demon-subduing dances" },
  ],
  etiquette: [
    "Always walk clockwise around stupas, mani walls, and prayer wheels",
    "Remove shoes before entering monasteries and homes",
    "Ask permission before photographing people, ceremonies, or religious sites",
    "Use right hand or both hands when giving or receiving — left hand is considered impure",
    "Dress modestly at religious sites — cover shoulders and knees",
    "Tipping guides and porters is customary — USD $15–20/day for guides, $10–12 for porters",
  ],
};

const environmentData = {
  conservationAreas: [
    { name: "Sagarmatha National Park", area: "1,148 km²", note: "UNESCO World Heritage Site — Everest, Lhotse, Cho Oyu" },
    { name: "Annapurna Conservation Area", area: "7,629 km²", note: "Nepal's largest protected area — ACAP managed by NTNC" },
    { name: "Langtang National Park", area: "1,710 km²", note: "Closest national park to Kathmandu — red panda habitat" },
    { name: "Makalu-Barun National Park", area: "1,500 km²", note: "No buffer zone — pristine eastern wilderness" },
    { name: "Kanchenjunga Conservation Area", area: "2,035 km²", note: "Community-managed — first conservation area in eastern Nepal" },
    { name: "Manaslu Conservation Area", area: "1,663 km²", note: "Restricted area — protects snow leopard and musk deer" },
    { name: "Shey-Phoksundo National Park", area: "3,555 km²", note: "Nepal's largest national park — Dolpo's turquoise lake" },
    { name: "Rara National Park", area: "106 km²", note: "Nepal's smallest national park — surrounds the country's largest lake" },
  ],
  wildlife: [
    { name: "Snow Leopard", status: "Vulnerable", range: "Dolpo, Manaslu, Kanchenjunga — approximately 300–400 in Nepal" },
    { name: "Red Panda", status: "Endangered", range: "Langtang, eastern Nepal temperate forests — bamboo dependent" },
    { name: "Himalayan Tahr", status: "Near Threatened", range: "Rocky slopes 3,000–5,000 m across all regions" },
    { name: "Musk Deer", status: "Endangered", range: "Dense forests 2,500–4,500 m — poaching pressure for musk gland" },
  ],
  principles: [
    "Pack out all waste — no burning trash at altitude",
    "Use established campsites and trails to prevent erosion",
    "Carry reusable water bottles — avoid single-use plastic in the mountains",
    "Support lodges using solar/micro-hydro power over diesel generators",
    "Hire local guides and porters — direct economic benefit to trail communities",
    "Respect wildlife buffer zones — maintain distance, never feed animals",
  ],
  climateImpact: "Nepal's glaciers have lost nearly a third of their ice since the 1990s. Shifting monsoon patterns affect trail seasons, glacial lakes pose GLOF risks, and high-altitude ecosystems face accelerating change. Responsible trekking minimizes footprint while supporting communities leading local conservation.",
};

export default function CulturePage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const sectionRefs = useRef({});

  useEffect(() => {
    document.body.classList.add("js-enhanced");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );
    const revealItems = document.querySelectorAll(".reveal");
    revealItems.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
      document.body.classList.remove("js-enhanced");
    };
  }, []);

  // Section nav active tracking
  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-80px 0px -50% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        sectionRefs.current[id] = el;
        sectionObserver.observe(el);
      }
    });
    return () => sectionObserver.disconnect();
  }, []);

  return (
    <div className="page-shell">
      <SiteHeader />
      <main id="main-content">
        <section className="page-hero">
          <div className="page-hero-inner reveal">
            <Breadcrumb items={[{ label: "Culture & Environment" }]} />
            <p className="eyebrow">People &amp; Place</p>
            <h1>The trail is shaped by the communities who live along it.</h1>
            <p>
              Eight ethnic groups, five major festivals, and eight national parks — the cultural
              and ecological fabric that makes the GHT more than a mountain route.
            </p>
          </div>
        </section>

        <nav className="section-nav" aria-label="Page sections">
          <div className="section-nav-inner">
            {SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`section-nav-link${activeSection === id ? " is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section className="culture-section" id="culture">
          <div className="section-heading reveal">
            <p className="eyebrow">People &amp; Culture</p>
            <h2>Communities of the high routes.</h2>
          </div>
          <div className="culture-peoples-grid">
            {cultureData.peoples.map((people) => (
              <article className="culture-people-card reveal" key={people.name}>
                <h3>{people.name}</h3>
                <span className="culture-people-region">{people.region}</span>
                <p>{people.note}</p>
              </article>
            ))}
          </div>
          <div className="culture-lower">
            <div className="culture-festivals reveal">
              <h3>Festivals Along the Trail</h3>
              <div className="culture-festivals-list">
                {cultureData.festivals.map((fest) => (
                  <div className="culture-festival-item" key={fest.name}>
                    <span className="culture-festival-timing">{fest.timing}</span>
                    <div>
                      <strong>{fest.name}</strong>
                      <p>{fest.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="culture-etiquette glass-panel reveal">
              <h3>Cultural Etiquette</h3>
              <ul>
                {cultureData.etiquette.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="environment-section" id="environment">
          <div className="section-heading reveal">
            <p className="eyebrow">Environment &amp; Conservation</p>
            <h2>Eight protected areas across Nepal's mountain spine.</h2>
          </div>
          <div className="env-parks-grid">
            {environmentData.conservationAreas.map((park) => (
              <div className="env-park-card reveal" key={park.name}>
                <strong>{park.name}</strong>
                <span className="env-park-area">{park.area}</span>
                <p>{park.note}</p>
              </div>
            ))}
          </div>
          <div className="env-lower">
            <div className="env-wildlife reveal">
              <h3>Key Wildlife</h3>
              <div className="env-wildlife-grid">
                {environmentData.wildlife.map((animal) => (
                  <div className="env-wildlife-card" key={animal.name}>
                    <strong>{animal.name}</strong>
                    <span className="env-wildlife-status">{animal.status}</span>
                    <p>{animal.range}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="env-principles glass-panel reveal">
              <h3>Leave No Trace — High Altitude</h3>
              <ul>
                {environmentData.principles.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="env-climate reveal">
            <p className="eyebrow">Climate Impact</p>
            <p>{environmentData.climateImpact}</p>
          </div>
        </section>
      </main>
      <div className="lotus-divider" aria-hidden="true"><div className="lotus-divider-icon" /></div>
      <SiteFooter />
    </div>
  );
}
