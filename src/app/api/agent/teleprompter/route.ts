import { getProvider } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getPersona } from "@/lib/personaManager";
import { SYSTEM_TRUTHFULNESS } from "@/lib/ai/prompts";

const TeleprompterSchema = z.object({
  videoScript: z.string().describe("A 60-second video script meant to be read off a teleprompter. Should be confident, concise, and highlight 2 key achievements from the CV that perfectly match the job."),
  estimatedDurationSeconds: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobDescription, personaId } = body;
    
    if (!jobDescription) {
      return NextResponse.json({ error: "Missing job description" }, { status: 400 });
    }

    const cv = getPersona(personaId);
    if (!cv) {
      return NextResponse.json({ error: "No CV persona found" }, { status: 400 });
    }

    const { model } = getProvider();
    
    const prompt = `
Write a 60-second Loom video pitch script for this candidate applying to this job.
The script must sound natural when spoken aloud. DO NOT use corporate jargon.
Use a strong hook, highlight exactly 2 verified achievements from the CV that match the job, and end with a clear call to action for an interview.

Job Description:
${jobDescription}

Candidate CV:
${JSON.stringify(cv, null, 2)}
`;

    const { object } = await generateObject({
      model,
      schema: TeleprompterSchema,
      system: SYSTEM_TRUTHFULNESS,
      prompt,
      temperature: 0.5,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error("Teleprompter AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
