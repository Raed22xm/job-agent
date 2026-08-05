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
      category: z.enum(["technical", "behavioral", "situational", "cultural"]).optional(),
      whyTheyAsk: z.string(),
      suggestedAnswerFramework: z.string(),
      cvReference: z.string(),
    })
  ).max(7),
  starStories: z.array(
    z.object({
      title: z.string(),
      situation: z.string(),
      task: z.string(),
      action: z.string(),
      result: z.string(),
      usableFor: z.array(z.string()),
    })
  ).max(3),
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

## Questions (exactly 5)
Generate exactly 5 questions they are most likely to ask. Mix these categories:
- 2 TECHNICAL questions based on the job description's required skills/tools
- 2 BEHAVIORAL questions using these proven patterns:
  * "Tell me about a time you failed or made a mistake" → map to a learning experience
  * "Tell me about a conflict with a colleague" → map to collaboration/resolution
  * "Tell me about a time you worked under pressure" → map to deadline/metric achievement
  * "Tell me about a time you took initiative" → map to proactive project work
- 1 CULTURAL/MOTIVATION question ("Why this company?", "Where do you see yourself in 3 years?")

For each question, provide:
- The question itself
- A "category" field: "technical", "behavioral", "situational", or "cultural"
- Why they are asking it (the underlying signal they want)
- A suggested answer framework using the STAR method (Situation → Task → Action → Result), drawing STRICTLY from the Candidate Experience facts
- A short "cvReference" pointing to a specific role/skill in the CV

## STAR Stories (exactly 3)
Build 3 reusable STAR stories from the candidate's experience that can be adapted to multiple behavioral questions:
- Each story has: title, situation, task, action, result
- Each story has a "usableFor" array listing 2-3 common interview question types it answers
- Draw ONLY from verified experience — never invent

## Weakness Strategy
Identify one likely gap between the CV and Job Description and suggest how to address it honestly using the "acknowledge → bridge → strength" framework.

Return JSON matching the schema.`;
}

function fallbackPrep(
  cv: MasterCV,
  jobTitle: string,
  company: string
): InterviewPrepResult {
  const role = cv.experience[0];
  const roleTitle = role?.title ?? "professional";
  const roleCompany = role?.company ?? "my company";
  const skill = cv.skills[0] ?? "my background";
  const topSkills = cv.skills.slice(0, 3).join(", ");
  const quantifiedBullet = role?.bullets.find((b) => /\d/.test(b));

  return {
    companyContext: `Interviewing for ${jobTitle} at ${company}.`,
    questions: [
      {
        question: `Tell me about your experience as a ${roleTitle}.`,
        category: "technical",
        whyTheyAsk: "To gauge your communication and relevance to the role.",
        suggestedAnswerFramework: `Discuss your recent role at ${roleCompany}, highlighting your work with ${topSkills}. ${quantifiedBullet ? `Use this achievement: "${quantifiedBullet}"` : ""}`,
        cvReference: `${roleTitle} at ${roleCompany}`,
      },
      {
        question: `Why do you want to work at ${company}?`,
        category: "cultural",
        whyTheyAsk: "To check for culture fit and genuine interest.",
        suggestedAnswerFramework: `Connect your career goals with the company's mission. Reference specific technologies from the job posting that match your skills: ${topSkills}.`,
        cvReference: "Personal objective + skills alignment",
      },
      {
        question: "Tell me about a time you had to learn a new technology quickly.",
        category: "behavioral",
        whyTheyAsk: "To assess your learning agility and adaptability.",
        suggestedAnswerFramework: `Use the STAR method: Describe a situation at ${roleCompany} where you picked up a new tool or framework. Focus on the concrete steps you took and the outcome.`,
        cvReference: `${roleTitle} at ${roleCompany}`,
      },
      {
        question: "Describe a project where something went wrong. How did you handle it?",
        category: "behavioral",
        whyTheyAsk: "To evaluate your problem-solving and resilience under pressure.",
        suggestedAnswerFramework: "Pick a real challenge from your experience. Structure as: What happened → What you did → What you learned → How it made you better.",
        cvReference: "Recent project experience",
      },
      {
        question: `What technical approach would you take for a ${jobTitle} role?`,
        category: "technical",
        whyTheyAsk: "To understand your technical thinking and decision-making.",
        suggestedAnswerFramework: `Walk through your preferred stack (${topSkills}) and explain trade-offs. Reference specific projects where you made architectural decisions.`,
        cvReference: "Skills + projects section",
      },
    ],
    starStories: [
      {
        title: `Building with ${skill} at ${roleCompany}`,
        situation: `At ${roleCompany}, the team needed to deliver a key feature.`,
        task: `As ${roleTitle}, I was responsible for the technical implementation.`,
        action: `I ${quantifiedBullet ? quantifiedBullet.split(".")[0]?.toLowerCase() ?? "led the implementation" : "led the implementation using " + topSkills}.`,
        result: quantifiedBullet ?? "The project was delivered successfully and adopted by the team.",
        usableFor: ["Tell me about a project you're proud of", "Describe a technical challenge", "Give an example of teamwork"],
      },
    ],
    weaknessStrategy: `If asked about missing skills, use the acknowledge-bridge-strength framework: "I haven't worked directly with [gap skill], but my experience with ${topSkills} gives me a strong foundation. At ${roleCompany}, I quickly ramped up on new technologies — for example, ${quantifiedBullet ? quantifiedBullet.split(".")[0] : "learning new tools within weeks"}."`,
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
