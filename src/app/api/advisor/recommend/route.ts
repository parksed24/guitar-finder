import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAdvisorResponse } from "@/lib/advisor-results";

const advisorRequestSchema = z.object({
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().positive(),
  genres: z.array(z.string().min(1)).default([]),
  artists: z.array(z.string().min(1)).default([]),
  tunings: z.array(z.string().min(1)).default([]),
  strings: z.number().int().positive().optional(),
  conditionPreference: z.enum(["new-only", "used-ok", "used-preferred"]),
  pickupType: z.enum(["active", "passive", "mixed"]).optional(),
  bridgeType: z.string().min(1).optional(),
  allowStretchBudget: z.boolean().optional()
}).refine(value => value.budgetMax >= value.budgetMin, {
  message: "budgetMax must be greater than or equal to budgetMin.",
  path: ["budgetMax"]
});

export async function POST(request: Request) {
  const parsed = advisorRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid advisor preferences.", issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json(buildAdvisorResponse(parsed.data));
}
