import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import masterCV from "../../../../../data/master-cv.json";
import type { MasterCV } from "@/types";
import { SYSTEM_TRUTHFULNESS } from "@/lib/ai/prompts";

const OutreachSchema = z.object({
  linkedinNote: z.string().max(300),
  emailSubject: z.string(),
  emailBody: z.string(),
  followUpMessage: z.string(),
  tone: z.enum(["formal", "friendly", "direct"]),
});

export type OutreachDraft = z.infer<typeof OutreachSchema>;

function buildOutreachPrompt(
  cv: MasterCV,
  jobTitle: string,
  company: string,
  tags: string[]
): string {
  const name = cv.personalInfo.fullName;
  const currentRole = cv.experience[0]?.title ?? "professional";
  const topSkills = cv.skills.slice(0, 6).join(", ");
  const recentExp = cv.experience[0];

  return `${SYSTEM_TRUTHFULNESS}

You are writing outreach messages for ${name}, a ${currentRole}, applying to "${jobTitle}" at ${company}.

Their verified background:
- Current/recent role: ${recentExp?.title} at ${recentExp?.company}
- Top skills: ${topSkills}
- Job tags match: ${tags.join(", ")}

Write three outreach messages. Use ONLY the facts above — never invent achievements or metrics.

Rules:
- LinkedIn note: ≤300 characters, warm and specific, not generic
- Email: professional subject line + 3-paragraph body (intro, value prop, CTA)
- Follow-up: a short 2-3 sentence follow-up message for 1 week later
- Match tone to the company: startups = friendly, enterprises = formal

Return JSON with: linkedinNote, emailSubject, emailBody, followUpMessage, tone`;
}

function fallbackOutreach(
  cv: MasterCV,
  jobTitle: string,
  company: string
): OutreachDraft {
  const name = cv.personalInfo.fullName;
  const role = cv.experience[0]?.title ?? "professional";
  const skill = cv.skills[0] ?? "my background";

  return {
    linkedinNote: `Hi! I noticed the ${jobTitle} opening at ${company}. As a ${role} with experience in ${skill}, I think there's a strong fit. Would love to connect!`,
    emailSubject: `${jobTitle} at ${company} — ${name}`,
    emailBody: `Dear Hiring Team,\n\nI'm ${name}, a ${role}, and I'm excited about the ${jobTitle} position at ${company}.\n\nMy experience with ${skill} aligns well with what you're looking for. I'd welcome the opportunity to discuss how I can contribute.\n\nBest regards,\n${name}`,
    followUpMessage: `Hi, I wanted to follow up on my application for the ${jobTitle} role at ${company}. I remain very interested and would love to chat if you have availability.`,
    tone: "friendly",
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { jobTitle, company, tags = [] } = body;

  if (!jobTitle || !company) {
    return NextResponse.json(
      { error: "jobTitle and company are required" },
      { status: 400 }
    );
  }

  const cv = masterCV as MasterCV;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      draft: fallbackOutreach(cv, jobTitle, company),
      mode: "local",
    });
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: OutreachSchema,
      system: SYSTEM_TRUTHFULNESS,
      prompt: buildOutreachPrompt(cv, jobTitle, company, tags),
      temperature: 0.5,
    });

    return NextResponse.json({ draft: object, mode: "ai" });
  } catch {
    return NextResponse.json({
      draft: fallbackOutreach(cv, jobTitle, company),
      mode: "local-fallback",
    });
  }
}
