"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, GitCompare, Grid2X2, Heart, List, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinderListingResult, FinderResponse } from "@/lib/finder-results";
import type { AdvisorResponse } from "@/lib/advisor-results";
import { formatMoney } from "@/lib/money";

interface Props {
  initialListings: FinderListingResult[];
}

type Mode = "finder" | "advisor";
type ViewMode = "grid" | "list";

const defaultQuery = "PRS Holcomb Core Cobalt Smokeburst";

export default function FinderExperience({ initialListings }: Props) {
  const [mode, setMode] = useState<Mode>("finder");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState(defaultQuery);
  const [finderResult, setFinderResult] = useState<FinderResponse | null>(null);
  const [advisorResult, setAdvisorResult] = useState<AdvisorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [advisorForm, setAdvisorForm] = useState({
    budgetMin: "3000",
    budgetMax: "5000",
    genres: "djent",
    artists: "Misha Mansoor",
    tunings: "Drop A",
    strings: "7",
    conditionPreference: "new-only"
  });

  const activeListings = finderResult?.listings ?? initialListings;
  const resultSubtitle = finderResult
    ? finderResult.interpretedProduct?.displayName ?? "No safe interpretation found"
    : "Approved catalog listings";

  async function runFinder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const response = await fetch("/api/finder/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    setFinderResult(await response.json());
    setIsLoading(false);
  }

  async function runAdvisor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    const response = await fetch("/api/advisor/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetMin: Number(advisorForm.budgetMin),
        budgetMax: Number(advisorForm.budgetMax),
        genres: splitList(advisorForm.genres),
        artists: splitList(advisorForm.artists),
        tunings: splitList(advisorForm.tunings),
        strings: advisorForm.strings ? Number(advisorForm.strings) : undefined,
        conditionPreference: advisorForm.conditionPreference
      })
    });
    setAdvisorResult(await response.json());
    setIsLoading(false);
  }

  const advisorSections = useMemo(() => {
    if (!advisorResult) return [];

    return [
      ["Best Match", advisorResult.bestMatch ? [advisorResult.bestMatch] : []],
      ["Artist-Authentic Alternatives", advisorResult.artistAuthenticAlternatives],
      ["High-Fit Alternatives", advisorResult.highFitAlternatives],
      ["Best Value", advisorResult.bestValue ? [advisorResult.bestValue] : []]
    ] as const;
  }, [advisorResult]);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">GF</div>
          <div>
            <h1>Guitar Finder</h1>
            <p>Exact models first. Alternatives clearly marked.</p>
          </div>
        </div>
        <div className="mode-tabs" aria-label="Mode">
          <button className={`chip-button ${mode === "finder" ? "active" : ""}`} onClick={() => setMode("finder")}>
            Finder
          </button>
          <button className={`chip-button ${mode === "advisor" ? "active" : ""}`} onClick={() => setMode("advisor")}>
            Advisor
          </button>
        </div>
      </header>

      <div className="workspace">
        {mode === "finder" ? (
          <section className="search-band">
            <form className="search-form" onSubmit={runFinder}>
              <input
                aria-label="Exact model search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="PRS Holcomb Core Cobalt Smokeburst"
              />
              <button className="primary-button" type="submit" disabled={isLoading}>
                <Search size={18} />
                {isLoading ? "Checking" : "Search"}
              </button>
            </form>
          </section>
        ) : (
          <section className="advisor-band">
            <form onSubmit={runAdvisor}>
              <div className="advisor-grid">
                <div className="field">
                  <label>
                    Budget min
                    <input
                      inputMode="numeric"
                      value={advisorForm.budgetMin}
                      onChange={event => setAdvisorForm({ ...advisorForm, budgetMin: event.target.value })}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Budget max
                    <input
                      inputMode="numeric"
                      value={advisorForm.budgetMax}
                      onChange={event => setAdvisorForm({ ...advisorForm, budgetMax: event.target.value })}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Artists
                    <input
                      value={advisorForm.artists}
                      onChange={event => setAdvisorForm({ ...advisorForm, artists: event.target.value })}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Genres
                    <input
                      value={advisorForm.genres}
                      onChange={event => setAdvisorForm({ ...advisorForm, genres: event.target.value })}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Tunings
                    <input
                      value={advisorForm.tunings}
                      onChange={event => setAdvisorForm({ ...advisorForm, tunings: event.target.value })}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Strings
                    <input
                      inputMode="numeric"
                      value={advisorForm.strings}
                      onChange={event => setAdvisorForm({ ...advisorForm, strings: event.target.value })}
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Condition
                    <select
                      value={advisorForm.conditionPreference}
                      onChange={event => setAdvisorForm({ ...advisorForm, conditionPreference: event.target.value })}
                    >
                      <option value="new-only">New only</option>
                      <option value="used-ok">Used ok</option>
                      <option value="used-preferred">Used preferred</option>
                    </select>
                  </label>
                </div>
                <button className="primary-button" type="submit" disabled={isLoading}>
                  <SlidersHorizontal size={18} />
                  {isLoading ? "Ranking" : "Recommend"}
                </button>
              </div>
            </form>
          </section>
        )}

        {mode === "finder" ? (
          <section className="results-band">
            <div className="results-head">
              <div>
                <h2>{activeListings.length} listings</h2>
                <p>{resultSubtitle}</p>
              </div>
              <div className="view-toggle" aria-label="Result view">
                <button
                  className={`icon-button ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid2X2 size={18} />
                </button>
                <button
                  className={`icon-button ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            {activeListings.length > 0 ? (
              <div className={`listing-grid ${viewMode}`}>
                {activeListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className="empty-state">No exact listings found for that interpreted model.</p>
            )}
          </section>
        ) : (
          <section className="advisor-results">
            {advisorResult ? (
              <>
                <button className="secondary-button" onClick={() => setAdvisorResult(null)}>
                  Edit Advisor Answers
                </button>
                {advisorSections.map(([title, cards]) =>
                  cards.length > 0 ? (
                    <div className="advisor-section" key={title}>
                      <h2>{title}</h2>
                      <div className="advisor-cards">
                        {cards.map(card => (
                          <article className={`advisor-card ${title === "Best Match" ? "primary" : ""}`} key={card.id}>
                            <div className="advisor-image">
                              <img src={card.imageUrl} alt="" />
                            </div>
                            <div className="advisor-body">
                              <div className="advisor-title">{card.title}</div>
                              <div className="meta-row">
                                <span>{card.strings} strings</span>
                                <span className="confidence">{Math.round(card.confidence * 100)}%</span>
                              </div>
                              <div className="tag-row">
                                <span className="tag">{card.bridgeType}</span>
                                <span className="tag">{card.pickupType} pickups</span>
                              </div>
                              <p>{card.reasons.slice(0, 2).join("; ")}</p>
                              <p>{card.tradeoffs.length > 0 ? card.tradeoffs.join("; ") : "No major tradeoffs flagged."}</p>
                              <button
                                className="secondary-button"
                                onClick={() => {
                                  setMode("finder");
                                  setQuery(card.exactFinderSearchQuery);
                                }}
                              >
                                Exact Finder Search
                                <ArrowRight size={16} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </>
            ) : (
              <p className="empty-state">Set hard constraints and run Advisor for ranked options.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function ListingCard({ listing }: { listing: FinderListingResult }) {
  return (
    <article className="listing-card">
      <div className="listing-image">
        <Link href={`/listings/${listing.id}`} aria-label={listing.title}>
          <img src={listing.imageUrl} alt="" />
        </Link>
        <div className="overlay-actions">
          <button className="icon-button" aria-label="Save listing" title="Save listing" type="button">
            <Heart size={16} />
          </button>
          <button className="icon-button" aria-label="Compare listing" title="Compare listing" type="button">
            <GitCompare size={16} />
          </button>
        </div>
      </div>
      <div className="listing-body">
        <div className="listing-title">{listing.title}</div>
        <div className="meta-row">
          <span>{listing.sourceName}</span>
          <span>{listing.condition}</span>
        </div>
        <div className="cost-row">
          <span>Total estimate</span>
          <strong>{formatMoney(listing.totalEstimatedCost)}</strong>
        </div>
        <div className="tag-row">
          <span className="tag">{listing.sellerType}</span>
          <span className="tag">
            <CheckCircle2 size={12} /> exact
          </span>
        </div>
      </div>
    </article>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}
