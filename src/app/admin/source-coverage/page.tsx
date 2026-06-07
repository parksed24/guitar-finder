import { defaultSourceAdapters } from "@/lib/source-adapters";
import { targetedSourceRows } from "@/lib/source-registry";

export const dynamic = "force-dynamic";

export default async function SourceCoveragePage() {
  const adapterHealth = await Promise.all(defaultSourceAdapters().map(adapter => adapter.healthCheck()));
  const rows = targetedSourceRows();

  return (
    <main className="page">
      <div className="phone">
        <div className="screen">
          <div className="topbar">
            <div className="brand">Source <span>Coverage</span></div>
          </div>
          <div className="content">
            <section className="home-section">
              <h1>Source coverage</h1>
              <p>Review source reach, adapter status, and coverage gaps.</p>
            </section>

            <section className="home-section">
              <h2>Adapters</h2>
              <div className="saved-list">
                {adapterHealth.map(health => (
                  <article className="saved-card" key={health.sourceId}>
                    <div className="saved-label">{health.sourceId}</div>
                    <h3>{health.healthy ? "Ready" : health.configured ? "Needs attention" : "Not configured"}</h3>
                    {health.lastError && <p>{health.lastError}</p>}
                  </article>
                ))}
              </div>
            </section>

            <section className="home-section">
              <h2>Registry</h2>
              <div className="saved-list">
                {rows.map(row => (
                  <article className="saved-card" key={row.id}>
                    <div className="saved-label">{row.sourceType} · {row.acquisitionMode}</div>
                    <h3>{row.displayName}</h3>
                    <p>{row.domain}</p>
                    <p>{row.health}</p>
                    <p>
                      Qualified {row.listingsQualified} · Rejected {row.listingsRejected} ·
                      Sold removed {row.soldListingsRemoved} · Images {row.listingsWithImages}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
