import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";
import { fallbackRoleplay } from "@/lib/english";

const RequestSchema = z.object({
  scenario: z.enum(["Daily stand-up", "Ask for clarification", "Share a project update", "Workplace small talk"]),
  message: z.string().trim().min(1).max(1000),
  focusWords: z.array(z.string().max(80)).max(8).default([]),
});

const TurnSchema = z.object({
  reply: z.string().min(2).max(500),
  correction: z.string().max(300).optional(),
  explanation: z.string().max(300).optional(),
  suggestions: z.array(z.string().max(100)).min(1).max(2),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid scenario and write a reply of up to 1000 characters." }, { status: 400 });

  const fallback = fallbackRoleplay(parsed.data.message, parsed.data.scenario);
  const usesOpenAIWithoutKey = (process.env.AI_PROVIDER || "openai") === "openai" && !process.env.OPENAI_API_KEY;
  if (usesOpenAIWithoutKey) return NextResponse.json({ turn: fallback, mode: "local-fallback" });

  try {
    const { model } = getProvider();
    const { object } = await generateObject({
      model,
      schema: TurnSchema,
      temperature: 0.55,
      system: "You are a warm B1 workplace English conversation coach. Continue the roleplay naturally. Correct only one important mistake. Keep the exchange concise and confidence-building.",
      prompt: `Scenario: ${parsed.data.scenario}\nLearner's reply: ${parsed.data.message}\nUseful phrases to encourage when natural: ${parsed.data.focusWords.join(", ") || "none yet"}\n\nReply as the colleague, then optionally provide one corrected sentence, a short explanation, and one or two expressions the learner can use next.`,
    });
    return NextResponse.json({ turn: object, mode: "ai" });
  } catch {
    return NextResponse.json({ turn: fallback, mode: "local-fallback" });
  }
}
