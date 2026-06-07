import { assessListingAvailability, sourceForUrl } from "@/lib/source-registry";
import { searchOpenWebForGuitars } from "@/lib/web-search";

export const dynamic = "force-dynamic";

export default async function ListingAuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const response = query
    ? await searchOpenWebForGuitars(query, { forceRefresh: true })
    : undefined;
  const diagnostics = response?.diagnostics;
  const listings = response?.webResults ?? [];

  return (
    <main className="page">
      <div className="phone">
        <div className="screen">
          <div className="topbar">
            <div className="brand">Listing <span>Audit</span></div>
          </div>
          <div className="content">
            <section className="home-section">
              <h1>Listing audit</h1>
              <p>Inspect search coverage, source parsing, and listing quality.</p>
              <form className="search" action="/admin/listing-audit">
                <span style={{ color: "#8da1b1" }}>⌕</span>
                <input name="q" defaultValue={query} placeholder="Search an exact guitar" />
                <button className="search-btn" type="submit">Audit</button>
              </form>
            </section>

            {response && (
              <section className="home-section">
                <h2>Summary</h2>
                <p>Queries: {response.generatedQueries.length}</p>
                <p>Candidates: {response.candidateCount} · Kept: {response.qualifiedCount} · Rejected: {response.rejectedCount}</p>
                <p>Adapters: {diagnostics?.directAdapterRequestCount ?? 0} · Direct listings: {diagnostics?.directAdapterListingCount ?? 0}</p>
                <p>Sold or unavailable removed: {diagnostics?.soldOrUnavailableRemoved ?? 0}</p>
                <p>Unknown stores discovered: {diagnostics?.unknownDomainsDiscovered ?? 0}</p>
              </section>
            )}

            {diagnostics && (
              <section className="home-section">
                <h2>Rejections</h2>
                <div className="saved-list">
                  {Object.entries(diagnostics.rejectionReasons).map(([reason, count]) => (
                    <article className="saved-card" key={reason}>
                      <div className="saved-label">{count} result{count === 1 ? "" : "s"}</div>
                      <h3>{reason}</h3>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {listings.length > 0 && (
              <section className="home-section">
                <h2>Kept listings</h2>
                <div className="saved-list">
                  {listings.map(listing => {
                    const source = sourceForUrl(listing.url);
                    const availability = assessListingAvailability(`${listing.title} ${listing.snippet ?? ""}`, listing.url, listing.availability);
                    return (
                      <article className="saved-card" key={listing.id}>
                        <div className="saved-label">{listing.sourceName || listing.sourceDomain} · {listing.sourceType}</div>
                        <h3>{listing.title}</h3>
                        <p>{source?.acquisitionMode ?? "broad-web-discovery"} · {availability.status}</p>
                        <p>{listing.priceLabel || "No safe numeric price"} · {listing.primaryImage?.url ? "image found" : "no image"}</p>
                        <p>{listing.enrichmentMethod || listing.extractionMethod} · cache {listing.enrichmentConfidence ? "checked" : "search result only"}</p>
                        <p>{listing.url}</p>
                        <div className="saved-card-actions">
                          <a className="saved-primary" href={listing.url} target="_blank" rel="noreferrer">Open original</a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {response && (
              <section className="home-section">
                <h2>Queries</h2>
                <div className="saved-list">
                  {response.generatedQueries.map(queryVariant => (
                    <article className="saved-card" key={queryVariant}>
                      <p>{queryVariant}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
