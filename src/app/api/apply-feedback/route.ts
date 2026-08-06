import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getProvider } from "@/lib/ai/provider";
import {
  applyFeedbackPrompt,
  HUMAN_WRITING_STANDARD,
  SYSTEM_TRUTHFULNESS,
} from "@/lib/ai/prompts";
import { AppliedFeedbackSchema } from "@/lib/ai/schemas";
import { getAIConfig, resolveOpenAIModel } from "@/lib/ai/providers";
import { resolvePersonaId } from "@/lib/cvLanguage";
import { buildProfessionalSummary } from "@/lib/generateCV";
import { getPersona } from "@/lib/personaManager";

function formatAIError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Apply feedback failed";
  if (/does not have access to model/i.test(raw)) {
    const model = resolveOpenAIModel();
    return `Your OpenAI project cannot use "${model}". Set OPENAI_MODEL=gpt-4o-mini in .env (or another model your project supports), then restart npm run dev.`;
  }
  return raw;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cv, job, feedbackItem, personaId: rawPersonaId } = body;

    if (!cv || !job || !feedbackItem) {
      return NextResponse.json(
        { error: "cv, job, and feedbackItem are required" },
        { status: 400 }
      );
    }

    if (feedbackItem.section === "summary") {
      const personaId = resolvePersonaId(
        typeof rawPersonaId === "string" ? rawPersonaId : undefined
      );
      const master = getPersona(personaId);
      if (!master) {
        return NextResponse.json(
          { error: `No CV persona found for "${personaId}"` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        updatedSection: "summary",
        summary: buildProfessionalSummary(master),
        skills: null,
        experience: null,
      });
    }

    const aiConfig = getAIConfig();
    if (!aiConfig.isConfigured) {
      return NextResponse.json(
        { error: "AI is not configured. Add OPENAI_API_KEY to .env" },
        { status: 503 }
      );
    }

    const cvJson = JSON.stringify(cv, null, 2);
    const jobJson = JSON.stringify(job, null, 2);
    const feedbackSection = feedbackItem.section;
    const feedbackMessage = feedbackItem.message;
    const feedbackSuggestion = feedbackItem.suggestion || "Fix the issue according to the message.";

    const prompt = applyFeedbackPrompt(
      cvJson,
      jobJson,
      feedbackSection,
      feedbackMessage,
      feedbackSuggestion
    );

    const { model } = getProvider();

    const { object } = await generateObject({
      model,
      schema: AppliedFeedbackSchema,
      system: `${SYSTEM_TRUTHFULNESS}

${HUMAN_WRITING_STANDARD}`,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Apply feedback failed:", error);
    return NextResponse.json({ error: formatAIError(error) }, { status: 400 });
  }
}
