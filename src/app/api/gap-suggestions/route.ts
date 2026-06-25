import { NextResponse } from "next/server";
import { buildGapSuggestions } from "@/lib/gapSuggestions";
import { getMasterCV } from "@/lib/matchCV";
import { normalizeStringArray } from "@/lib/normalizeStoredData";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { missingKeywords?: unknown };
    const missingKeywords = normalizeStringArray(body.missingKeywords);
    const suggestions = buildGapSuggestions(missingKeywords, getMasterCV());

    return NextResponse.json({ suggestions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gap suggestions failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
