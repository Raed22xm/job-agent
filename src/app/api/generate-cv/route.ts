import { NextResponse } from "next/server";
import { validateGeneratedCV } from "@/lib/cv/validateCV";
import { generateCV } from "@/lib/generateCV";
import { getMasterCV, matchCV } from "@/lib/matchCV";
import type { ParsedJob } from "@/types";

/** Local heuristic CV regeneration. Use POST /api/analyze-job for the full AI pipeline. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      job?: ParsedJob;
    };

    if (!body.job?.rawText) {
      return NextResponse.json({ error: "job with rawText is required" }, { status: 400 });
    }

    const cv = getMasterCV();
    const match = matchCV(body.job, cv);
    const generatedCV = generateCV(cv, body.job, match);
    const validation = validateGeneratedCV(generatedCV, cv);

    return NextResponse.json({
      mode: "local-heuristic",
      note: "For AI-enhanced tailoring, use POST /api/analyze-job.",
      generatedCV,
      validation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CV generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
