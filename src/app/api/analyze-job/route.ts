import { NextResponse } from "next/server";
import { analyzeJobLocally } from "@/lib/analyzeJobLocal";
import { analyzeJobWithAI } from "@/lib/ai/analyzeJobWithAI";
import { getAIConfig } from "@/lib/ai/providers";
import { parseMasterCV } from "@/lib/ai/schemas";
import { resolvePersonaId } from "@/lib/cvLanguage";
import { getPersona } from "@/lib/personaManager";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobDescription?: string;
      sourceUrl?: string;
      /** When true and AI is configured, merge AI enhancements. Default: local only. */
      enhanceWithAI?: boolean;
      /** Persona id: "danish" | "english" (defaults to danish). */
      personaId?: string;
    };

    const jobDescription = body.jobDescription?.trim();
    if (!jobDescription) {
      return NextResponse.json(
        { error: "jobDescription is required" },
        { status: 400 }
      );
    }

    const personaId = resolvePersonaId(body.personaId);
    const cv = getPersona(personaId);
    if (!cv) {
      return NextResponse.json(
        { error: `No CV persona found for "${personaId}"` },
        { status: 404 }
      );
    }

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
    const enhanceWithAI = body.enhanceWithAI === true;
    const baseline = analyzeJobLocally(jobDescription, sourceUrl, cv, personaId);
    const aiConfig = getAIConfig();

    if (enhanceWithAI && !aiConfig.isConfigured) {
      return NextResponse.json(
        {
          error:
            "AI is not configured. Add OPENAI_API_KEY to .env and restart the dev server (npm run dev).",
        },
        { status: 503 }
      );
    }

    if (!enhanceWithAI) {
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
