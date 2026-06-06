import { NextResponse } from "next/server";
import { z } from "zod";
import { buildFinderResponse } from "@/lib/finder-results";
import { searchOpenWebForGuitars } from "@/lib/web-search";

const finderRequestSchema = z.object({
  query: z.string().min(1).max(240),
  refresh: z.boolean().optional(),
  cursor: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = finderRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Expected a non-empty query." }, { status: 400 });
  }

  const [catalogResponse, webSearchResponse] = await Promise.all([
    Promise.resolve(buildFinderResponse(parsed.data.query)),
    searchOpenWebForGuitars(parsed.data.query, { forceRefresh: parsed.data.refresh, cursor: parsed.data.cursor })
  ]);

  return NextResponse.json({
    ...catalogResponse,
    mode: "web-search",
    webResults: webSearchResponse.webResults,
    webCount: webSearchResponse.count,
    nextCursor: webSearchResponse.nextCursor,
    hasMore: webSearchResponse.hasMore,
    candidateCount: webSearchResponse.candidateCount,
    qualifiedCount: webSearchResponse.qualifiedCount,
    rejectedCount: webSearchResponse.rejectedCount,
    webSummary: webSearchResponse.summary,
    generatedQueries: webSearchResponse.generatedQueries,
    parsedQuery: webSearchResponse.parsedQuery,
    shortcuts: webSearchResponse.shortcuts,
    apiConfigured: webSearchResponse.apiConfigured,
    searchCompleted: webSearchResponse.searchCompleted,
    errorMessage: webSearchResponse.errorMessage,
    diagnostics: webSearchResponse.diagnostics,
    checkedTimestamp: webSearchResponse.checkedTimestamp
  });
}
