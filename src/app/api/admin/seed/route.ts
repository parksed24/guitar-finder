import { NextResponse } from "next/server";
import { seedSupabase, validateSeedCatalog } from "../../../../../scripts/seed-supabase";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed endpoint is disabled in production." }, { status: 404 });
  }

  const validation = validateSeedCatalog();
  if (!validation.ok) {
    return NextResponse.json({ error: "Seed catalog validation failed.", issues: validation.errors }, { status: 422 });
  }

  try {
    const result = await seedSupabase();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to seed Supabase." },
      { status: 500 }
    );
  }
}
