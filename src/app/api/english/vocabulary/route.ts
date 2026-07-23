import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";
import { fallbackVocabulary } from "@/lib/english";

const RequestSchema = z.object({
  text: z.string().trim().min(20).max(4000),
  level: z.enum(["A2", "B1", "B2"]),
});

const VocabularySchema = z.object({
  items: z.array(z.object({
    phrase: z.string().min(2).max(80),
    definition: z.string().min(5).max(240),
    example: z.string().min(5).max(240),
    cloze: z.string().min(5).max(240),
  })).min(6).max(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Add 20–4000 characters of office-related text and choose a valid level." }, { status: 400 });
  }

  const localItems = fallbackVocabulary(parsed.data.text);
  const usesOpenAIWithoutKey = (process.env.AI_PROVIDER || "openai") === "openai" && !process.env.OPENAI_API_KEY;
  if (usesOpenAIWithoutKey) return NextResponse.json({ items: localItems, mode: "local-fallback" });

  try {
    const { model } = getProvider();
    const { object } = await generateObject({
      model,
      schema: VocabularySchema,
      temperature: 0.35,
      system: "You are an encouraging workplace English teacher. Return concise, natural English and do not invent facts about the supplied text.",
      prompt: `The learner is at CEFR ${parsed.data.level}. From the office text below, choose 6–8 highly reusable workplace words or multi-word phrases. Prefer phrases learners can use in meetings and email. For each, give a plain definition, one natural office example, and a cloze version of that example using ___ for the complete phrase.\n\nOFFICE TEXT:\n${parsed.data.text}`,
    });
    return NextResponse.json({ items: object.items, mode: "ai" });
  } catch {
    return NextResponse.json({ items: localItems, mode: "local-fallback" });
  }
}
