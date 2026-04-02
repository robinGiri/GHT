import { useEffect, useState, useRef } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Breadcrumb from "../components/Breadcrumb";

const SECTIONS = [
  { id: "experience", label: "Experience" },
  { id: "plan", label: "Routes" },
  { id: "logistics", label: "Logistics" },
  { id: "safety", label: "Safety" },
];

const logisticsData = [
  {
    icon: "📋",
    title: "Permits & Documentation",
    items: [
      "TIMS card required for most trekking regions (USD $20)",
      "Restricted area permits for Dolpo, Humla, Kanchenjunga, Manaslu, Upper Mustang (USD $500/10 days)",
      "National park entry fees vary: Sagarmatha $30, Annapurna $30, Langtang $30, Rara $30, Makalu-Barun $30",
      "Conservation area permits: Kanchenjunga $20, Gaurishankar $20, Manaslu $70–100",
      "Nepal tourist visa: 15/30/90 day options, extendable at Immigration Kathmandu",
      "Licensed trekking guide mandatory in all national parks since 2023",
    ],
  },
  {
    icon: "🗓",
    title: "Season Windows",
    items: [
      "Autumn (Oct–Nov): Prime season — stable weather, clear skies, post-monsoon freshness",
      "Spring (Mar–May): Rhododendron blooms, warmer but hazier, pre-monsoon buildup",
      "Winter (Dec–Feb): Cold but clear at lower elevations, high passes closed",
      "Monsoon (Jun–Sep): Mustang and Dolpo rain-shadow treks viable, leeches elsewhere",
    ],
  },
  {
    icon: "💰",
    title: "Budget Planning",
    items: [
      "Tea-house treks: USD $30–60/day (lodge, meals, permits)",
      "Camping treks (remote areas): USD $80–150/day (guide, porters, food, gear)",
      "Restricted area permits add USD $50–70/day to base costs",
      "Domestic flights (Lukla, Jomsom, Juphal, Simikot): USD $150–350 per sector",
      "Helicopter evacuation insurance essential — rescue costs USD $3,000–5,000+",
    ],
  },
  {
    icon: "🎒",
    title: "Essential Gear",
    items: [
      "4-season sleeping bag rated to -15°C for high passes",
      "Layered clothing system: base, insulation, hardshell, down jacket",
      "Trekking boots (broken in), gaiters for snow sections",
      "Crampons and ice axe for technical passes (Sherpani Col, Tashi Lapcha, Cho La)",
      "Water purification (SteriPEN, Aquamira, or LifeStraw), sun protection SPF 50+",
      "First aid kit with Diamox, rehydration salts, blister care",
    ],
  },
];

const safetyData = {
  difficultyTiers: [
    { level: "Easy", color: "#40956d", label: "Poon Hill, Ghorepani, Helambu", desc: "Well-marked trails, tea-house lodges, below 3,500 m. Suitable for fit beginners." },
    { level: "Moderate", color: "#3472a4", label: "EBC, ABC, Langtang, Manaslu Circuit", desc: "Sustained altitude 3,500–5,400 m. Requires acclimatization and good fitness." },
    { level: "Strenuous", color: "#d4832a", label: "Three Passes, Kanchenjunga, Upper Dolpo", desc: "Remote areas, high passes up to 5,500 m, camping sections, multi-week commitment." },
    { level: "Technical", color: "#9b3b52", label: "Sherpani Col, Tashi Lapcha, West Col", desc: "Mountaineering skills required. Fixed ropes, crampons, glacier travel above 6,000 m." },
  ],
  altitudeRules: [
    "Above 3,000 m: ascend no more than 500 m/day in sleeping altitude",
    "Every 3rd day: take an acclimatization rest day above 3,500 m",
    "Diamox (125–250 mg) prophylaxis: begin 1 day before ascent above 3,000 m",
    "AMS symptoms (headache, nausea, fatigue): do not ascend — descend if worsening",
    "HACE/HAPE: life-threatening — immediate descent and evacuation required",
    "Hydrate 3–4 liters/day at altitude, avoid alcohol and sleeping pills",
  ],
  emergencyInfo: [
    { label: "Helicopter rescue", value: "Available from Kathmandu, Lukla, Pokhara — weather dependent" },
    { label: "Insurance", value: "Mandatory travel insurance covering helicopter evacuation up to 6,500 m" },
    { label: "Communication", value: "Satellite phone or Garmin InReach for areas beyond mobile coverage" },
    { label: "TAAN rescue", value: "Trekking Agencies' Association of Nepal operates emergency coordination" },
    { label: "Hospital access", value: "CIWEC or Nepal International Clinic in Kathmandu for post-trek medical" },
  ],
};

export default function PlanPage() {
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
            <Breadcrumb items={[{ label: "Plan Your Trek" }]} />
            <p className="eyebrow">Preparation</p>
            <h1>Plan your GHT journey from first idea to final day.</h1>
            <p>
              Route length, permits, seasons, budget, gear, and safety — everything you need to
              commit to Nepal's high country with confidence.
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

        <section className="experience-section" id="experience">
          <div className="experience-copy reveal">
            <p className="eyebrow">Atmosphere</p>
            <h2>Built for travelers who want grandeur without flattening the place.</h2>
            <p>
              A meaningful Great Himalaya Trail journey balances physical ambition with time for
              acclimatization, village stays, local guides, weather patience, and the humility to
              let the mountains set the rhythm.
            </p>
          </div>
          <div className="experience-list">
            <article className="experience-item reveal">
              <h3>Tea-house rhythm</h3>
              <p>Warm kitchens, dal bhat refuels, and trail days anchored by local lodges.</p>
            </article>
            <article className="experience-item reveal">
              <h3>Remote camp sections</h3>
              <p>Western Nepal opens into longer, quieter stretches where logistics matter.</p>
            </article>
            <article className="experience-item reveal">
              <h3>Pass-crossing drama</h3>
              <p>Snow lines, moraine basins, prayer flags, and weather windows shape the route.</p>
            </article>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="plan-section reveal" id="plan">
          <div className="section-heading">
            <p className="eyebrow">Plan the crossing</p>
            <h2>Choose a route length that matches your appetite.</h2>
          </div>
          <div className="plan-grid">
            <article className="plan-card glass-panel">
              <span>Short immersion</span>
              <h3>12-18 days</h3>
              <p>Focus on one signature zone such as Everest, Manaslu, or Annapurna.</p>
            </article>
            <article className="plan-card glass-panel featured-plan">
              <span>Balanced expedition</span>
              <h3>4-6 weeks</h3>
              <p>Combine two to three regions with proper acclimatization and cultural depth.</p>
            </article>
            <article className="plan-card glass-panel">
              <span>Full traverse</span>
              <h3>3-5 months</h3>
              <p>Commit to a true east-west arc across Nepal's high country.</p>
            </article>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="logistics-section" id="logistics">
          <div className="section-heading reveal">
            <p className="eyebrow">Logistics &amp; Permits</p>
            <h2>What operators and trekkers need before the trail.</h2>
          </div>
          <div className="logistics-grid">
            {logisticsData.map((card) => (
              <article className="logistics-card glass-panel reveal" key={card.title}>
                <span className="logistics-icon" aria-hidden="true">{card.icon}</span>
                <h3>{card.title}</h3>
                <ul>
                  {card.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="safety-section" id="safety">
          <div className="section-heading reveal">
            <p className="eyebrow">Safety &amp; Difficulty</p>
            <h2>Know the terrain before you commit.</h2>
          </div>
          <div className="safety-tiers reveal">
            {safetyData.difficultyTiers.map((tier) => (
              <div className="safety-tier" key={tier.level} style={{ "--tier-color": tier.color }}>
                <div className="safety-tier-badge">
                  <span className="safety-tier-dot" />
                  <strong>{tier.level}</strong>
                </div>
                <div className="safety-tier-body">
                  <span className="safety-tier-routes">{tier.label}</span>
                  <p>{tier.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="safety-columns">
            <div className="safety-altitude reveal">
              <h3>Altitude Protocol</h3>
              <ul>
                {safetyData.altitudeRules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
            <div className="safety-emergency glass-panel reveal">
              <h3>Emergency &amp; Insurance</h3>
              {safetyData.emergencyInfo.map((info) => (
                <div className="safety-emergency-item" key={info.label}>
                  <span className="safety-emergency-label">{info.label}</span>
                  <span className="safety-emergency-value">{info.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <div className="lotus-divider" aria-hidden="true"><div className="lotus-divider-icon" /></div>
      <SiteFooter />
    </div>
  );
}
