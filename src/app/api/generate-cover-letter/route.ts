import { NextResponse } from "next/server";
import { getAIConfig } from "@/lib/ai/providers";
import { validateCoverLetter } from "@/lib/cv/validateCV";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import { getMasterCV } from "@/lib/matchCV";
import type { ParsedJob } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      job?: ParsedJob;
    };

    if (!body.job?.rawText) {
      return NextResponse.json({ error: "job with rawText is required" }, { status: 400 });
    }

    const cv = getMasterCV();
    const generatedCoverLetter = generateCoverLetter(cv, body.job);
    const validation = validateCoverLetter(
      generatedCoverLetter,
      cv,
      body.job.company
    );
    const aiConfig = getAIConfig();

    return NextResponse.json({
      mode: aiConfig.isConfigured ? "local-with-ai-available" : "local",
      generatedCoverLetter,
      validation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cover letter generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
