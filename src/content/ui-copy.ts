export const uiCopy = {
  home: {
    headline: "Find the guitar you’ve been looking for.",
    supportingText: "Search shops, marketplaces, and classifieds in one place.",
    searchPlaceholder: "Search model, finish, artist signature, or SKU",
    advisorTitle: "Not sure what to buy?",
    advisorBody: "Answer a few questions and we’ll narrow it down.",
    searchIdle: "Search for a guitar to see what’s out there."
  },

  results: {
    title: "Results",
    refresh: "Refresh search",
    reset: "Reset feed",
    save: "Save search",
    loadMore: "Load more results",
    loading: "Searching shops, marketplaces, and classifieds…",
    loadingMore: "Searching for more guitars…",
    reachedEnd: "You’ve reached the end of the available results.",
    likelyMatchesFound: (count: number) =>
      `${count} ${count === 1 ? "listing" : "listings"} found`,
    likelyMatchesFoundSoFar: (count: number) =>
      `${count} ${count === 1 ? "listing" : "listings"} found so far`
  },

  filters: {
    title: "Filters",
    clear: "Clear filters",
    clearAll: "Clear all",
    apply: (count: number) =>
      `Show ${count} ${count === 1 ? "result" : "results"}`,
    sortLabel: "Sort",
    recommended: "Recommended"
  },

  listing: {
    likelyExactMatch: "Likely exact match",
    possibleMatch: "Possible match",
    availabilityUnverified: "Availability unverified",
    priceOnSource: "Price available on listing",
    viewListing: "View listing",
    listingDetails: "Listing details",
    purchaseDetails: "Purchase details",
    aboutListing: "About this listing",
    totalEstimatedCost: "Total estimated cost",
    costBreakdown: "Cost breakdown",
    addToCompare: "Add to compare",
    backToResults: "Back to results",
    openOriginal: "Open original listing",
    confirmDetails: "Open the listing to confirm details."
  },

  fallback: {
    title: "Still looking?",
    helperText: "Check a few more places directly.",
    checkAnotherSite: "Check another site"
  },

  alerts: {
    saveSearch: "Save this search",
    title: "Want us to keep an eye out?",
    helperText: "Get notified when a new match shows up.",
    trackGuitar: "Track this guitar",
    priceDropAlerts: "Price-drop alerts",
    newListingAlerts: "New-listing alerts",
    chooseAlerts: "Choose your alerts"
  },

  advisor: {
    title: "Let’s narrow it down.",
    body: "Answer a few questions and we’ll point you toward guitars that fit.",
    genreQuestion: "What do you want to play?",
    artistQuestion: "Who inspires your sound?",
    tuningQuestion: "What tuning do you use?",
    usedQuestion: "Are you open to used guitars?",
    resultsTitle: "Your strongest matches",
    seeListings: "See listings",
    seeListingsForGuitar: "See listings for this guitar",
    editAnswers: "Edit answers"
  },

  account: {
    signInToSave: "Sign in to save this",
    savedIntro: "Sign in to save searches, listings, and alerts.",
    previewAuth: "Sign-in is simulated in this preview.",
    manage: "Manage your saved searches, listings, and alerts."
  },

  errors: {
    searchFailed: "Something went wrong while searching. Try again.",
    loadMoreFailed: "We couldn’t load more results. Give it another shot.",
    noUsefulResults: "That search didn’t return anything useful yet.",
    listingDetailsUnconfirmed:
      "We couldn’t confirm the details on this listing. Open the source to double-check."
  },

  emptyStates: {
    noExactMatchesTitle: "No exact matches yet.",
    noExactMatchesBody:
      "We didn’t find the exact guitar this time. Want us to keep an eye out?"
  }
} as const;
