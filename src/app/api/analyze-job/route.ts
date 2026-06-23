import { NextResponse } from "next/server";
import { analyzeJobLocally } from "@/lib/analyzeJobLocal";
import { analyzeJobWithAI } from "@/lib/ai/analyzeJobWithAI";
import { getAIConfig } from "@/lib/ai/providers";
import { parseMasterCV } from "@/lib/ai/schemas";
import { getMasterCV } from "@/lib/matchCV";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobDescription?: string;
      sourceUrl?: string;
    };

    const jobDescription = body.jobDescription?.trim();
    if (!jobDescription) {
      return NextResponse.json(
        { error: "jobDescription is required" },
        { status: 400 }
      );
    }

    const cv = getMasterCV();
    const cvValidation = parseMasterCV(cv);
    if (!cvValidation.success) {
      return NextResponse.json(
        {
          error: "Master CV data is invalid",
          details: cvValidation.error.flatten(),
        },
        { status: 500 }
      );
    }

    const sourceUrl = body.sourceUrl?.trim() || undefined;
    const baseline = analyzeJobLocally(jobDescription, sourceUrl, cv);
    const aiConfig = getAIConfig();

    if (!aiConfig.isConfigured) {
      return NextResponse.json(baseline);
    }

    try {
      const result = await analyzeJobWithAI({
        jobDescription,
        sourceUrl,
        cv,
        baseline,
        config: aiConfig,
      });
      return NextResponse.json(result);
    } catch (aiError) {
      console.error("AI analysis failed, using heuristic fallback:", aiError);
      return NextResponse.json({
        ...baseline,
        mode: "ai-fallback" as const,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
