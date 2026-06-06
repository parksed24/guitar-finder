import { NextResponse } from "next/server";
import { z } from "zod";
import { buildFinderResponse } from "@/lib/finder-results";

const finderRequestSchema = z.object({
  query: z.string().min(1).max(240)
});

export async function POST(request: Request) {
  const parsed = finderRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Expected a non-empty query." }, { status: 400 });
  }

  return NextResponse.json(buildFinderResponse(parsed.data.query));
}
