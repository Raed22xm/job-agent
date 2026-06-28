import { getProvider } from "@/lib/ai/provider";
import { generateObject } from "ai";
import { z } from "zod";
import type { AnalyzeJobResult } from "@/lib/analyzeJobLocal";
import { mergeAIEnhancement } from "@/lib/ai/mergeAIAnalysis";
import {
  coverLetterPrompt,
  cvTailoringPrompt,
  jobAnalysisPrompt,
  missingSkillsPrompt,
  SYSTEM_TRUTHFULNESS,
} from "@/lib/ai/prompts";
import type { AIConfig } from "@/lib/ai/providers";
import { GeneratedCoverLetterSchema } from "@/lib/ai/schemas";
import type { MasterCV } from "@/types";

const AIJobFieldsSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  tools: z.array(z.string()),
  skills: z.array(z.string()),
  atsKeywords: z.array(z.string()),
});

export const AIJobEnhancementSchema = z.object({
  parsedJob: AIJobFieldsSchema,
  matchSummary: z.string(),
  recommendedFocusAreas: z.array(z.string()),
  cvSummary: z.string(),
  skillOrder: z.array(z.string()),
  coverLetter: GeneratedCoverLetterSchema,
});

export type AIJobEnhancement = z.infer<typeof AIJobEnhancementSchema>;

export interface AnalyzeJobWithAIOptions {
  jobDescription: string;
  sourceUrl?: string;
  cv: MasterCV;
  baseline: AnalyzeJobResult;
  config: AIConfig;
}

function buildAnalysisPrompt(
  jobDescription: string,
  cv: MasterCV,
  baseline: AnalyzeJobResult
): string {
  const masterCVJson = JSON.stringify(cv, null, 2);
  const heuristicJobJson = JSON.stringify(baseline.job, null, 2);
  const matchJson = JSON.stringify(
    {
      score: baseline.match.score,
      matchedKeywords: baseline.match.matchedKeywords,
      missingKeywords: baseline.match.missingKeywords,
      summary: baseline.match.summary,
    },
    null,
    2
  );

  return `${SYSTEM_TRUTHFULNESS}

Analyze the job posting against the master CV and return structured enhancements.

Rules:
- parsedJob: extract fields ONLY from the job posting text (use heuristic baseline as hint)
- matchSummary: 2-3 sentences about fit using ONLY verified CV facts; mention gaps honestly
- recommendedFocusAreas: 4-8 actionable bullets; never suggest adding unverified skills
- cvSummary: tailored professional summary using ONLY verified CV facts; match job posting language (Danish if job is Danish)
- skillOrder: reorder ALL master CV skills by job relevance — same skills only, no additions or removals
- coverLetter: concise 3-paragraph letter using ONLY verified experience; match job posting language

${jobAnalysisPrompt(jobDescription)}

${cvTailoringPrompt(masterCVJson, heuristicJobJson, baseline.match.matchedKeywords)}

${coverLetterPrompt(masterCVJson, heuristicJobJson)}

${missingSkillsPrompt(masterCVJson, baseline.match.missingKeywords)}

Heuristic baseline:
Job: ${heuristicJobJson}
Match: ${matchJson}

Master CV:
${masterCVJson}`;
}

export async function analyzeJobWithAI(
  options: AnalyzeJobWithAIOptions
): Promise<AnalyzeJobResult> {
  const { jobDescription, sourceUrl, cv, baseline, config } = options;

  const object = await generateEnhancement(
    config,
    buildAnalysisPrompt(jobDescription, cv, baseline)
  );

  return mergeAIEnhancement(
    baseline,
    object,
    cv,
    jobDescription,
    sourceUrl
  );
}

async function generateEnhancement(
  config: AIConfig,
  prompt: string
): Promise<AIJobEnhancement> {
  const { model } = getProvider();

  try {
    const { object } = await generateObject({
      model,
      schema: AIJobEnhancementSchema,
      system: SYSTEM_TRUTHFULNESS,
      prompt,
      temperature: 0.1,
    });
    return object;
  } catch (error) {
    console.error(`AI analysis failed:`, error);
    throw error;
  }
}
