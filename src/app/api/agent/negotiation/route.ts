import { getProvider } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getPersona } from "@/lib/personaManager";
import { SYSTEM_TRUTHFULNESS } from "@/lib/ai/prompts";

const NegotiationSchema = z.object({
  estimatedSalaryRangeDKK: z.string().describe("Estimated monthly salary range in DKK (e.g. 45,000 - 55,000 DKK)"),
  leveragePoints: z.array(z.string()).describe("3 points of leverage the candidate has based on their exact CV matches to the job"),
  negotiationScript: z.string().describe("A professional, confident email script to send to the recruiter to negotiate the top of the range"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobDescription, personaId, matchScore } = body;
    
    const cv = getPersona(personaId);
    if (!cv) {
      return NextResponse.json({ error: "No CV persona found" }, { status: 400 });
    }

    const { model } = getProvider();
    
    const prompt = `
You are an expert tech recruiter in Denmark. You are advising a candidate on how to negotiate their salary.
The candidate has a semantic match score of ${matchScore || "Unknown"}% for this role.

Target Job Description:
${jobDescription || "Standard mid/senior tech role in Denmark."}

Candidate CV:
${JSON.stringify(cv, null, 2)}

Based on the Danish market rates for this role, and the candidate's exact experience, generate:
1. A realistic estimated monthly salary range in DKK.
2. The candidate's strongest points of leverage (why they deserve the top of the range).
3. A professional email script to counter-offer and negotiate.
`;

    const { object } = await generateObject({
      model,
      schema: NegotiationSchema,
      system: SYSTEM_TRUTHFULNESS,
      prompt,
      temperature: 0.4,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error("Negotiation AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
