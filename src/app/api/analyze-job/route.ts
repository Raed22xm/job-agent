import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobLocally } from "@/lib/analyzeJobLocal";
import { analyzeJobWithAI } from "@/lib/ai/analyzeJobWithAI";
import { getAIConfig } from "@/lib/ai/providers";
import { parseMasterCV } from "@/lib/ai/schemas";
import { resolvePersonaId } from "@/lib/cvLanguage";
import { getPersona } from "@/lib/personaManager";
import { logger } from "@/lib/logger";

const AnalyzeJobRequestSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(40, "A full job description is required")
    .max(100_000, "jobDescription is too large"),
  sourceUrl: z
    .string()
    .trim()
    .max(2_048, "sourceUrl is too long")
    .url("sourceUrl must be a valid URL")
    .refine(
      (value) => ["http:", "https:"].includes(new URL(value).protocol),
      "sourceUrl must use http or https"
    )
    .optional(),
  enhanceWithAI: z.boolean().optional(),
  personaId: z.string().trim().min(1).max(64).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json().catch(() => ({}))) as unknown;
    const parseResult = AnalyzeJobRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { jobDescription, sourceUrl: rawSourceUrl, enhanceWithAI: shouldEnhanceWithAI, personaId: rawPersonaId } = parseResult.data;

    const personaId = resolvePersonaId(rawPersonaId);
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

    const sourceUrl = rawSourceUrl?.trim() || undefined;
    const enhanceWithAI = shouldEnhanceWithAI === true;
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

    if (!enhanceWithAI || !aiConfig.isConfigured) {
      return NextResponse.json(baseline);
    }

    try {
      const merged = await analyzeJobWithAI({
        jobDescription,
        sourceUrl,
        cv,
        baseline,
        config: aiConfig,
      });
      return NextResponse.json(merged);
    } catch (aiError) {
      logger.error("AI analysis failed, using heuristic fallback:", aiError);
      return NextResponse.json({ ...baseline, mode: "ai-fallback" });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
