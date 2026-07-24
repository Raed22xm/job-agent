import { getProvider } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getPersona } from "@/lib/personaManager";
import { SYSTEM_TRUTHFULNESS } from "@/lib/ai/prompts";

const CopilotInsightSchema = z.object({
  detectedQuestion: z.string(),
  starPoints: z.array(z.string()).describe("3-4 bullet points using the STAR method from the candidate's CV"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, personaId } = body;
    
    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const cv = getPersona(personaId);
    if (!cv) {
      return NextResponse.json({ error: "No CV persona found" }, { status: 400 });
    }

    const { model } = getProvider();
    
    const prompt = `
The following is a live transcript from an interview:
"${transcript}"

Analyze the transcript. Is the interviewer asking a behavioral or technical question?
If so, extract the core question. Then, using ONLY the facts from the candidate's CV below, generate 3-4 bullet points using the STAR method (Situation, Task, Action, Result) to help the candidate answer the question perfectly.

Candidate CV:
${JSON.stringify(cv, null, 2)}
`;

    const { object } = await generateObject({
      model,
      schema: CopilotInsightSchema,
      system: SYSTEM_TRUTHFULNESS,
      prompt,
      temperature: 0.2,
    });

    return NextResponse.json(object);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Copilot AI error";
    logger.error("Copilot AI Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
