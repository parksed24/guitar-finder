import Link from "next/link";
import { notFound } from "next/navigation";
import { listingDetail } from "@/lib/catalog-presenter";
import { formatMoney } from "@/lib/money";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = listingDetail(id);

  if (!detail) notFound();

  const { listing, all, index, previous, next } = detail;
  const checkedDate = new Date(listing.checkedTimestamp).toLocaleDateString("en-US");

  return (
    <main className="page">
      <div className="phone">
        <div className="screen">
          <div className="topbar">
            <Link className="brand" href="/">
              Guitar <span>Finder</span>
            </Link>
            <div className="top-actions">
              <Link className="icon-btn home-icon" aria-label="Home" href="/">⌂</Link>
              <Link className="icon-btn" aria-label="Saved searches" href="/">♡</Link>
              <Link className="icon-btn account-icon" aria-label="Account" href="/">♙</Link>
            </div>
          </div>

          <div className="content">
            <div className="listing-toolbar">
              <Link className="back-results" href="/">← Back to results</Link>
              <div className="pager">
                {previous ? <Link className="pager-btn" href={`/listings/${previous.id}`}>‹</Link> : <span className="pager-btn" aria-disabled="true">‹</span>}
                <div className="pager-count">{index + 1} of {all.length}</div>
                {next ? <Link className="pager-btn" href={`/listings/${next.id}`}>›</Link> : <span className="pager-btn" aria-disabled="true">›</span>}
              </div>
              <div className="toolbar-spacer" />
            </div>

            <section className="product-hero">
              <div className="pad">
                <div className="retailer">{listing.sourceName}</div>
                <div className="product-title-row">
                  <div>
                    <h2 style={{ marginTop: 6 }}>{listing.title}</h2>
                    <p>Checked {checkedDate} from {listing.seller}.</p>
                  </div>
                  <span className="condition-pill">{listing.condition}</span>
                </div>
              </div>
            </section>

            <div className="gallery-wrap">
              <div className="gallery-main">
                <img src={listing.imageUrl} alt={listing.title} />
                <button className="gallery-arrow prev" type="button" aria-label="Previous photo">‹</button>
                <button className="gallery-arrow next" type="button" aria-label="Next photo">›</button>
                <div className="gallery-counter">1 / 1</div>
              </div>
              <div className="gallery">
                <button className="thumb active" type="button">
                  <img src={listing.imageUrl} alt={`${listing.title} photo 1`} />
                </button>
              </div>
            </div>

            <div className="checkout-card">
              <div className="checkout-kicker">Total estimated cost</div>
              <div className="checkout-main">
                <div>
                  <div className="checkout-total">{formatMoney(listing.totalEstimatedCost)}</div>
                  <div className="checkout-note">Includes instrument, shipping, estimated tax, and import duty.</div>
                </div>
              </div>
              <details className="inline-breakdown" open>
                <summary className="cost-toggle">Cost breakdown</summary>
                <div className="receipt-row"><span>Instrument price</span><span>{formatMoney(listing.itemPrice)}</span></div>
                <div className="receipt-row"><span>Shipping</span><span>{formatMoney(listing.shipping)}</span></div>
                <div className="receipt-row"><span>Estimated sales tax</span><span>{formatMoney(listing.estimatedSalesTax)}</span></div>
                <div className="receipt-row"><span>Estimated import duty</span><span>{formatMoney(listing.estimatedImportDuty)}</span></div>
                <div className="receipt-row total"><span>Total estimated cost</span><span>{formatMoney(listing.totalEstimatedCost)}</span></div>
              </details>
              <a className="checkout-cta" href={listing.sourceUrl}>Open on {listing.sourceName}</a>
              <div className="checkout-secondary"><span>{listing.sellerType} · {listing.condition}</span></div>
            </div>

            <div className="priority-section">
              <div className="section-head"><div><h2>Listing details</h2></div></div>
              <div className="info-grid">
                <div className="info"><small>Source</small><b>{listing.sourceName}</b></div>
                <div className="info"><small>Seller type</small><b>{listing.sellerType}</b></div>
                <div className="info"><small>Seller</small><b>{listing.seller}</b></div>
                <div className="info"><small>Last checked</small><b>{checkedDate}</b></div>
              </div>
            </div>

            <div className="priority-section">
              <div className="section-head"><div><h2>Purchase details</h2></div></div>
              <div className="info-grid">
                <div className="info"><small>Item price</small><b>{formatMoney(listing.itemPrice)}</b></div>
                <div className="info"><small>Shipping</small><b>{formatMoney(listing.shipping)}</b></div>
                <div className="info"><small>Sales tax</small><b>{formatMoney(listing.estimatedSalesTax)}</b></div>
                <div className="info"><small>Import duty</small><b>{formatMoney(listing.estimatedImportDuty)}</b></div>
              </div>
            </div>

            <div className="priority-section">
              <div className="section-head"><div><h2>About this listing</h2></div></div>
              <div className="shop-card">
                <div className="shop-logo">{listing.sourceName.slice(0, 2).toUpperCase()}</div>
                <div><b>{listing.sourceName}</b><span>{listing.sellerType} · {listing.seller}</span></div>
              </div>
              <button className="cta-secondary" type="button">Add to compare</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
