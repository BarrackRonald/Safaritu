// app/api/search/route.ts
// Public search endpoint — no auth required.
// Used by the explore page search box.

import { NextRequest, NextResponse } from "next/server";
import { searchTours } from "@/lib/prisma/platform";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const query       = searchParams.get("q")           ?? undefined;
    const destination = searchParams.get("destination") ?? undefined;
    const difficulty  = searchParams.get("difficulty")  ?? undefined;
    const minDays     = searchParams.get("minDays")     ? parseInt(searchParams.get("minDays")!)  : undefined;
    const maxDays     = searchParams.get("maxDays")     ? parseInt(searchParams.get("maxDays")!)  : undefined;
    const maxPrice    = searchParams.get("maxPrice")    ? parseInt(searchParams.get("maxPrice")!) : undefined;

    const tours = await searchTours({ query, destination, difficulty, minDays, maxDays, maxPrice });
    return NextResponse.json({ success: true, data: tours });
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}