import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { scaleLinear } from "d3-scale";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Breadcrumb from "../components/Breadcrumb";
import { trailChunks, parseRangeToMid } from "../data/trailChunks";

const regionColors = [
  "#d4832a", "#2d8a8e", "#3472a4", "#7556a0",
  "#40956d", "#3558a1", "#d4613a", "#b2793a", "#9b3b52",
];

export default function JourneysPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const chunkParam = searchParams.get("chunk");
  const activeChunkId = trailChunks.find((c) => c.id === chunkParam)?.id || trailChunks[0].id;
  const setActiveChunkId = (id) => setSearchParams((prev) => { prev.set("chunk", id); return prev; }, { replace: true });

  useEffect(() => {
    document.body.classList.add("js-enhanced");
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
    revealItems.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
      document.body.classList.remove("js-enhanced");
    };
  }, []);

  const chunksWithMetrics = useMemo(() => trailChunks.map((chunk) => {
    const places = chunk.places.map((place) => {
      const daysValue = parseRangeToMid(place.days);
      const stages = (place.stages ?? []).map((stage) => ({
        ...stage,
        daysValue: parseRangeToMid(stage.days),
      }));
      return { ...place, daysValue, kmValue: parseRangeToMid(place.km), stages };
    });
    const totalDays = places.reduce((sum, place) => sum + place.daysValue, 0);
    return { ...chunk, places, totalDays };
  }), []);

  const allPlaceKm = useMemo(() => chunksWithMetrics.flatMap((chunk) =>
    chunk.places.map((place) => place.kmValue).filter((v) => v !== null)
  ), [chunksWithMetrics]);

  const kmBarScale = useMemo(() => scaleLinear()
    .domain([Math.min(...allPlaceKm), Math.max(...allPlaceKm)])
    .range([20, 100]), [allPlaceKm]);

  const activeChunk = chunksWithMetrics.find((c) => c.id === activeChunkId) ?? chunksWithMetrics[0];

  return (
    <div className="page-shell">
      <SiteHeader />
      <main id="main-content">
        <section className="page-hero">
          <div className="page-hero-inner reveal">
            <Breadcrumb items={[{ label: "Journeys" }]} />
            <p className="eyebrow">East to West</p>
            <h1>Nine journeys across Nepal's mountain spine.</h1>
            <p>
              Use these sections as planning blocks. Start with the popular corridors, then stitch
              in remote segments when you want deeper expedition character.
            </p>
          </div>
        </section>

        <div className="prayer-flags" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>

        <section className="journey-section" id="chunks">
          <div className="journey-map reveal">
            <div className="journey-map-bg" aria-hidden="true">
              <svg viewBox="0 0 1200 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mtn-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(212,131,42,0.07)" />
                    <stop offset="50%" stopColor="rgba(64,149,109,0.07)" />
                    <stop offset="100%" stopColor="rgba(155,59,82,0.07)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,85 Q75,70 150,62 Q225,54 300,38 Q375,22 450,28 Q525,34 600,18 Q675,2 750,28 Q825,54 900,42 Q975,30 1050,52 Q1125,74 1200,78 L1200,100 L0,100 Z"
                  fill="url(#mtn-grad)"
                />
              </svg>
            </div>
            <div className="journey-track-container">
              <div className="journey-track-bg" />
              <div
                className="journey-track-fill"
                style={{ width: `${((parseInt(activeChunk.id, 10) - 1) / 8) * 100}%` }}
              />
              {chunksWithMetrics.map((chunk, i) => {
                const isActive = chunk.id === activeChunk.id;
                const color = regionColors[i];
                return (
                  <button
                    key={chunk.id}
                    className={`journey-node${isActive ? " is-active" : ""}`}
                    style={{ "--nc": color, left: `${(i / 8) * 100}%` }}
                    onClick={() => setActiveChunkId(chunk.id)}
                    aria-pressed={isActive}
                    aria-label={`${chunk.title} — ${chunk.band}`}
                  >
                    <span className="journey-node-pip" />
                    <span className="journey-node-num">{chunk.id}</span>
                    <span className="journey-node-title">{chunk.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="journey-map-ends">
              <span>Kanchenjunga</span>
              <span>Humla</span>
            </div>
          </div>

          <div
            className="journey-detail"
            style={{ "--accent": regionColors[parseInt(activeChunk.id, 10) - 1] }}
          >
            <div className="journey-detail-header">
              <span className="journey-badge">{activeChunk.id}</span>
              <div className="journey-detail-titles">
                <span className="journey-detail-band">{activeChunk.band}</span>
                <h2>{activeChunk.title}</h2>
              </div>
              <div className="journey-detail-pills">
                <span className="journey-pill">{activeChunk.style}</span>
                <span className="journey-pill">~{Math.round(activeChunk.totalDays)} days</span>
                <span className="journey-pill">{activeChunk.places.length} routes</span>
              </div>
            </div>

            {(activeChunk.elevation || activeChunk.season || activeChunk.permit) && (
              <div className="journey-meta-row">
                {activeChunk.elevation && (
                  <div className="journey-meta-item">
                    <span className="journey-meta-label">High point</span>
                    <span className="journey-meta-value">{activeChunk.elevation}</span>
                  </div>
                )}
                {activeChunk.season && (
                  <div className="journey-meta-item">
                    <span className="journey-meta-label">Best season</span>
                    <span className="journey-meta-value">{activeChunk.season}</span>
                  </div>
                )}
                {activeChunk.permit && (
                  <div className="journey-meta-item">
                    <span className="journey-meta-label">Permits</span>
                    <span className="journey-meta-value">{activeChunk.permit}</span>
                  </div>
                )}
              </div>
            )}

            <div className="journey-routes">
              {activeChunk.places.map((place, pi) => (
                <article className="journey-route is-open" key={place.name}>
                  <div className="journey-route-header">
                    <span className="journey-route-idx">{pi + 1}</span>
                    <div className="journey-route-info">
                      <strong>{place.name}</strong>
                      <span>
                        {place.days} days
                        {place.km ? ` · ${place.km} km` : ""}
                        {place.estimated ? " (est.)" : ""}
                      </span>
                    </div>
                    {place.km ? (
                      <span className="journey-bar" aria-hidden="true">
                        <span
                          className="journey-bar-fill"
                          style={{ width: `${Math.round(kmBarScale(place.kmValue))}%` }}
                        />
                      </span>
                    ) : null}
                  </div>

                  {place.highlight && (
                    <p className="journey-route-highlight">{place.highlight}</p>
                  )}

                  {place.stages.length > 0 && (
                    <div className="journey-stages">
                      {place.stages.map((stage, si) => (
                        <div className="journey-stage" key={`${stage.title}-${si}`}>
                          <div className="journey-stage-marker">
                            <span className="journey-stage-dot" />
                            {si < place.stages.length - 1 && (
                              <span className="journey-stage-connector" />
                            )}
                          </div>
                          <div className="journey-stage-body">
                            <div className="journey-stage-head">
                              <span className="journey-stage-num">Stage {si + 1}</span>
                              <span className="journey-stage-days">Days {stage.days}</span>
                            </div>
                            <strong>{stage.title}</strong>
                            <p>{stage.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
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
