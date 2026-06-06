import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, GitCompare, Heart } from "lucide-react";
import { notFound } from "next/navigation";
import { listingDetail } from "@/lib/catalog-presenter";
import { formatMoney } from "@/lib/money";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = listingDetail(id);

  if (!detail) notFound();

  const { listing, all, index, previous, next } = detail;

  return (
    <main className="shell">
      <header className="detail-topbar">
        <div className="brand">
          <div className="brand-mark">GF</div>
          <div>
            <h1>Guitar Finder</h1>
            <p>{index + 1} of {all.length}</p>
          </div>
        </div>
        <Link className="secondary-button" href="/">
          <ArrowLeft size={17} />
          Back to Results
        </Link>
      </header>

      <section className="detail-grid">
        <div>
          <div className="detail-image">
            <img src={listing.imageUrl} alt="" />
            <div className="overlay-actions">
              <button className="icon-button" aria-label="Save listing" title="Save listing" type="button">
                <Heart size={16} />
              </button>
              <button className="icon-button" aria-label="Compare listing" title="Compare listing" type="button">
                <GitCompare size={16} />
              </button>
            </div>
          </div>
          <div className="gallery-controls">
            <button className="secondary-button" type="button">Previous Photo</button>
            <span className="tag">1 of 3</span>
            <button className="secondary-button" type="button">Next Photo</button>
          </div>
        </div>

        <div className="detail-copy">
          <div>
            <div className="tag-row">
              <span className="tag">{listing.sourceName}</span>
              <span className="tag">{listing.condition}</span>
              <span className="tag">{listing.sellerType}</span>
            </div>
            <h1>{listing.title}</h1>
            <p>Checked {new Date(listing.checkedTimestamp).toLocaleDateString("en-US")} from {listing.seller}.</p>
          </div>

          <div className="cost-block">
            <div className="total-cost">
              <span>Total estimated cost</span>
              <strong>{formatMoney(listing.totalEstimatedCost)}</strong>
            </div>
            <details className="breakdown">
              <summary>Cost breakdown</summary>
              <dl>
                <div>
                  <dt>Item price</dt>
                  <dd>{formatMoney(listing.itemPrice)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{formatMoney(listing.shipping)}</dd>
                </div>
                <div>
                  <dt>Estimated sales tax</dt>
                  <dd>{formatMoney(listing.estimatedSalesTax)}</dd>
                </div>
                <div>
                  <dt>Estimated import duty</dt>
                  <dd>{formatMoney(listing.estimatedImportDuty)}</dd>
                </div>
              </dl>
            </details>
          </div>

          <a className="primary-button" href={listing.sourceUrl}>
            Open on {listing.sourceName}
            <ExternalLink size={17} />
          </a>

          <nav className="detail-nav" aria-label="Listing navigation">
            {previous ? (
              <Link className="secondary-button" href={`/listings/${previous.id}`}>
                <ArrowLeft size={17} />
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="tag">{index + 1} of {all.length}</span>
            {next ? (
              <Link className="secondary-button" href={`/listings/${next.id}`}>
                Next
                <ArrowRight size={17} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </section>
    </main>
  );
}
