import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getProvider } from "@/lib/ai/provider";
import { applyFeedbackPrompt, SYSTEM_TRUTHFULNESS } from "@/lib/ai/prompts";
import { AppliedFeedbackSchema } from "@/lib/ai/schemas";
import { getAIConfig } from "@/lib/ai/providers";

export async function POST(request: Request) {
  try {
    const aiConfig = getAIConfig();
    if (!aiConfig.isConfigured) {
      return NextResponse.json(
        { error: "AI is not configured. Add OPENAI_API_KEY to .env" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { cv, job, feedbackItem } = body;

    if (!cv || !job || !feedbackItem) {
      return NextResponse.json(
        { error: "cv, job, and feedbackItem are required" },
        { status: 400 }
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
      system: SYSTEM_TRUTHFULNESS,
      prompt,
      temperature: 0.1,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Apply feedback failed:", error);
    const message = error instanceof Error ? error.message : "Apply feedback failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
