import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import masterCV from "../../../../../data/master-cv.json";
import type { MasterCV } from "@/types";
import {
  buildCVAuditPrompt,
  fallbackAudit,
  type CVAuditResult,
} from "@/lib/agent/cvAudit";

const SYSTEM = `You are an expert CV auditor and career coach. Audit the CV honestly and constructively. Return only JSON — no prose.`;

const SectionScoreSchema = z.object({
  section: z.string(),
  score: z.number().min(0).max(100),
  label: z.enum(["Strong", "Good", "Needs Work", "Weak"]),
  issues: z.array(z.string()),
  tips: z.array(z.string()),
  rewrittenExample: z.string().nullable().optional(),
});

const CVAuditSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  sections: z.array(SectionScoreSchema),
  topPriorities: z.array(z.string()),
  atsRisk: z.enum(["Low", "Medium", "High"]),
  wordCount: z.number(),
});

export async function POST() {
  const cv = masterCV as MasterCV;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const result: CVAuditResult = fallbackAudit(cv);
    return NextResponse.json({ result, mode: "local" });
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: CVAuditSchema,
      system: SYSTEM,
      prompt: buildCVAuditPrompt(cv),
      temperature: 0.3,
    });

    return NextResponse.json({ result: object, mode: "ai" });
  } catch {
    const result: CVAuditResult = fallbackAudit(cv);
    return NextResponse.json({ result, mode: "local-fallback" });
  }
}
