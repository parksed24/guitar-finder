import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "guitar-finder",
    checkedAt: new Date().toISOString()
  });
}
