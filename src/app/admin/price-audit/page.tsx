import { searchOpenWebForGuitars } from "@/lib/web-search";

export const dynamic = "force-dynamic";

export default async function PriceAuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const response = query
    ? await searchOpenWebForGuitars(query, { forceRefresh: true })
    : undefined;
  const listings = response?.webResults ?? [];
  const priced = listings.filter(listing => listing.itemPrice !== undefined);

  return (
    <main className="page">
      <div className="phone">
        <div className="screen">
          <div className="topbar">
            <div className="brand">Price <span>Audit</span></div>
          </div>
          <div className="content">
            <section className="home-section">
              <h1>Price audit</h1>
              <p>Check how listing prices were found without showing diagnostics to shoppers.</p>
              <form className="search" action="/admin/price-audit">
                <span style={{ color: "#8da1b1" }}>⌕</span>
                <input name="q" defaultValue={query} placeholder="Search an exact guitar" />
                <button className="search-btn" type="submit">Audit</button>
              </form>
            </section>

            {response && (
              <section className="home-section">
                <h2>Summary</h2>
                <p>Listings found: {listings.length}</p>
                <p>Listings with numeric prices: {priced.length}</p>
                <p>Listings missing prices: {listings.length - priced.length}</p>
              </section>
            )}

            {listings.length > 0 && (
              <section className="home-section">
                <h2>Listings</h2>
                <div className="saved-list">
                  {listings.map(listing => (
                    <article className="saved-card" key={listing.id}>
                      <div className="saved-label">{listing.sourceName || listing.sourceDomain}</div>
                      <h3>{listing.title}</h3>
                      <p><b>{listing.priceLabel || "Missing numeric price"}</b> · {listing.enrichmentMethod || listing.extractionMethod}</p>
                      <p>{listing.url}</p>
                      <div className="saved-card-actions">
                        <a className="saved-primary" href={listing.url} target="_blank" rel="noreferrer">Open original</a>
                      </div>
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
