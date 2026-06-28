import { getProvider } from "@/lib/ai/provider";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { getPersona } from "@/lib/personaManager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { jobDescription, personaId } = body;

    const cv = getPersona(personaId);
    if (!cv) {
      return new Response("No CV persona found", { status: 400 });
    }

    const { model } = getProvider();

    const prompt = `
You are the moderator of a highly critical hiring boardroom.
You will simulate a live debate between 3 distinct agents reviewing the candidate's CV for the given job.

Agent 1: The Recruiter (Focuses on ATS, missing keywords, formatting, red flags)
Agent 2: The Hiring Manager (Focuses on technical depth, impact, numbers, real-world skills)
Agent 3: The Reviewer (Synthesizes the debate into a final verdict)

You must output the debate as a continuous stream of dialogue.
Format each speaker clearly like this:
**Recruiter**: [Dialogue]
**Hiring Manager**: [Dialogue]
**Reviewer**: [Dialogue]

Candidate CV:
${JSON.stringify(cv, null, 2)}

Target Job Description:
${jobDescription || "No job description provided, do a general review."}

Begin the debate now. Let them argue a bit about the strengths and weaknesses. End with the Reviewer making a final decision (Reject, Interview, or Hire).
`;

    const result = await streamText({
      model,
      prompt,
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Boardroom AI Error:", error);
    return new Response(error.message, { status: 500 });
  }
}
