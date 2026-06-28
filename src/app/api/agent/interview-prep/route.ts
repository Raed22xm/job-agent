import { getProvider } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getPersona } from "@/lib/personaManager";
import type { MasterCV } from "@/types";
import { SYSTEM_TRUTHFULNESS } from "@/lib/ai/prompts";

const InterviewPrepSchema = z.object({
  companyContext: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      whyTheyAsk: z.string(),
      suggestedAnswerFramework: z.string(),
      cvReference: z.string(),
    })
  ).max(5),
  weaknessStrategy: z.string(),
});

export type InterviewPrepResult = z.infer<typeof InterviewPrepSchema>;

function buildInterviewPrompt(
  cv: MasterCV,
  jobTitle: string,
  company: string,
  jobDescription: string
): string {
  const name = cv.personalInfo.fullName;
  const currentRole = cv.experience[0]?.title ?? "professional";
  const experienceSummary = cv.experience.map(e => `${e.title} at ${e.company}: ${e.bullets.slice(0, 2).join(". ")}`).join(" | ");

  return `${SYSTEM_TRUTHFULNESS}

You are an expert technical recruiter preparing ${name} (${currentRole}) for an interview for the "${jobTitle}" role at ${company}.

Job Description snippet:
${jobDescription.substring(0, 2000)}

Candidate Experience:
${experienceSummary}
Skills: ${cv.skills.join(", ")}

Generate a highly specific interview prep guide. 
Return exactly 5 questions they are most likely to ask based on the job description.
For each question, provide:
- The question itself.
- Why they are asking it (the underlying signal they want).
- A suggested framework to answer it using the STAR method, drawing STRICTLY from the Candidate Experience facts provided above.
- A short "cvReference" pointing to a specific role/skill in the CV they should mention.

Also provide a "weaknessStrategy": identify one likely gap between the CV and Job Description and suggest how to address it honestly.

Return JSON matching the schema.`;
}

function fallbackPrep(
  cv: MasterCV,
  jobTitle: string,
  company: string
): InterviewPrepResult {
  const role = cv.experience[0]?.title ?? "professional";
  const skill = cv.skills[0] ?? "my background";

  return {
    companyContext: `Interviewing for ${jobTitle} at ${company}.`,
    questions: [
      {
        question: `Tell me about your experience as a ${role}.`,
        whyTheyAsk: "To gauge your communication and relevance to the role.",
        suggestedAnswerFramework: `Discuss your recent role, highlighting your work with ${skill}.`,
        cvReference: "Recent experience section",
      },
      {
        question: `Why do you want to work at ${company}?`,
        whyTheyAsk: "To check for culture fit and genuine interest.",
        suggestedAnswerFramework: "Connect your career goals with the company's mission.",
        cvReference: "Personal objective",
      },
    ],
    weaknessStrategy: "If asked about missing skills, emphasize your ability to learn quickly based on your past project ramp-ups.",
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  
  const personaId = body.personaId;
  const cv = getPersona(personaId);
  
  if (!cv) {
    return NextResponse.json({ error: "No CV persona found" }, { status: 400 });
  }

  const { jobTitle, company, jobDescription = "" } = body;

  if (!jobTitle || !company) {
    return NextResponse.json(
      { error: "jobTitle and company are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      prep: fallbackPrep(cv, jobTitle, company),
      mode: "local-fallback",
    });
  }

  try {
    const { model } = getProvider();

    const { object } = await generateObject({
      model,
      schema: InterviewPrepSchema,
      system: SYSTEM_TRUTHFULNESS,
      prompt: buildInterviewPrompt(cv, jobTitle, company, jobDescription),
      temperature: 0.7,
    });

    return NextResponse.json({ prep: object, mode: "ai" });
  } catch {
    return NextResponse.json({
      prep: fallbackPrep(cv, jobTitle, company),
      mode: "local-fallback",
    });
  }
}
