import { getSourceDiscoveryCandidates } from "@/lib/source-registry";

export const dynamic = "force-dynamic";

export default function SourceDiscoveryPage() {
  const candidates = getSourceDiscoveryCandidates();

  return (
    <main className="page">
      <div className="phone">
        <div className="screen">
          <div className="topbar">
            <div className="brand">Source <span>Discovery</span></div>
          </div>
          <div className="content">
            <section className="home-section">
              <h1>Source discovery</h1>
              <p>Unfamiliar stores that passed listing checks will appear here for review.</p>
            </section>

            <section className="home-section">
              {candidates.length === 0 ? (
                <div className="empty">No new store domains yet. Run a few searches and check back.</div>
              ) : (
                <div className="saved-list">
                  {candidates.map(candidate => (
                    <article className="saved-card" key={candidate.domain}>
                      <div className="saved-label">{candidate.reviewStatus} · seen {candidate.discoveryCount}x</div>
                      <h3>{candidate.domain}</h3>
                      <p>First seen {candidate.firstSeenAt}</p>
                      <p>Last seen {candidate.lastSeenAt}</p>
                      <div className="saved-card-actions">
                        {candidate.exampleUrls.slice(0, 2).map(url => (
                          <a className="saved-primary" href={url} key={url} target="_blank" rel="noreferrer">Open example</a>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
