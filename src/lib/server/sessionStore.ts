import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { AnalysisMode } from "@/lib/analyzeJobLocal";
import type { CvLanguage } from "@/lib/cvLanguage";
import type {
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
} from "@/types";

const RELATIVE_PATH = path.join("data", "session", "current-analysis.json");

export const MAX_SESSION_PAYLOAD_BYTES = 2 * 1024 * 1024;
const MAX_LONG_TEXT_LENGTH = 250_000;
const MAX_TEXT_LENGTH = 10_000;
const MAX_LIST_ITEMS = 500;

const text = z.string().max(MAX_TEXT_LENGTH);
const longText = z.string().max(MAX_LONG_TEXT_LENGTH);
const textList = z.array(text).max(MAX_LIST_ITEMS);

const PersonalInfoSchema = z.object({
  fullName: text,
  email: text,
  phone: text,
  location: text,
  linkedin: text.optional(),
  portfolio: text.optional(),
  summary: longText,
});

const ExperienceSchema = z.object({
  id: text,
  company: text,
  title: text,
  location: text,
  startDate: text,
  endDate: text,
  bullets: textList,
});

const EducationSchema = z.object({
  id: text,
  institution: text,
  degree: text,
  field: text,
  startDate: text,
  endDate: text,
  details: textList.optional(),
});

const ProjectSchema = z.object({
  id: text,
  name: text,
  description: longText,
});

const ParsedJobSchema = z.object({
  title: text,
  company: text,
  location: text,
  responsibilities: textList,
  requirements: textList,
  tools: textList,
  skills: textList,
  atsKeywords: textList,
  rawText: longText,
  sourceUrl: text.optional(),
});

const CategoryScoreSchema = z.object({
  matched: z.number().finite(),
  total: z.number().finite(),
  weight: z.number().finite(),
  score: z.number().finite(),
});

const ScoreBreakdownSchema = z.object({
  skillsMatch: CategoryScoreSchema,
  experienceMatch: CategoryScoreSchema,
  location: CategoryScoreSchema,
  language: CategoryScoreSchema,
  juniorFriendliness: CategoryScoreSchema,
  portfolioRelevance: CategoryScoreSchema,
  overall: z.number().finite(),
});

const MatchResultSchema = z.object({
  score: z.number().finite(),
  matchedKeywords: textList,
  missingKeywords: textList,
  recommendedFocusAreas: textList,
  summary: longText,
  scoreBreakdown: ScoreBreakdownSchema.optional(),
});

const GeneratedCVSchema = z.object({
  sections: z.object({
    header: PersonalInfoSchema,
    summary: longText,
    skills: textList,
    experience: z.array(ExperienceSchema).max(MAX_LIST_ITEMS),
    education: z.array(EducationSchema).max(MAX_LIST_ITEMS),
    projects: z.array(ProjectSchema).max(MAX_LIST_ITEMS).optional(),
  }),
  atsNotes: textList,
});

const GeneratedCoverLetterSchema = z.object({
  headline: text.default(""),
  greeting: text,
  paragraphs: z.array(longText).max(MAX_LIST_ITEMS),
  closing: text,
  signature: text,
});

export const AnalysisSessionInputSchema = z.object({
  jobUrl: text,
  jobDescription: longText,
  parsedJob: ParsedJobSchema.nullable(),
  matchResult: MatchResultSchema.nullable(),
  generatedCV: GeneratedCVSchema.nullable(),
  generatedCoverLetter: GeneratedCoverLetterSchema.nullable(),
  originalCV: GeneratedCVSchema.nullable(),
  originalCoverLetter: GeneratedCoverLetterSchema.nullable(),
  analysisMode: z.enum(["local", "ai", "ai-fallback"]).nullable(),
  cvLanguage: z.enum(["danish", "english"]).nullable().optional(),
});

export interface AnalysisSessionSnapshot {
  jobUrl: string;
  jobDescription: string;
  parsedJob: ParsedJob | null;
  matchResult: MatchResult | null;
  generatedCV: GeneratedCV | null;
  generatedCoverLetter: GeneratedCoverLetter | null;
  originalCV: GeneratedCV | null;
  originalCoverLetter: GeneratedCoverLetter | null;
  analysisMode: AnalysisMode | null;
  cvLanguage?: CvLanguage | null;
  updatedAt: string;
}

export function sessionFilePath(workspaceRoot = process.cwd()): string {
  const configuredPath = process.env.JOB_AGENT_SESSION_FILE?.trim();
  if (configuredPath) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(workspaceRoot, configuredPath);
  }

  return path.join(workspaceRoot, RELATIVE_PATH);
}

export async function readSessionFromDisk(
  workspaceRoot = process.cwd()
): Promise<AnalysisSessionSnapshot | null> {
  const filePath = sessionFilePath(workspaceRoot);

  try {
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw) as AnalysisSessionSnapshot;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

export async function writeSessionToDisk(
  snapshot: Omit<AnalysisSessionSnapshot, "updatedAt">,
  workspaceRoot = process.cwd()
): Promise<AnalysisSessionSnapshot> {
  const filePath = sessionFilePath(workspaceRoot);
  await mkdir(path.dirname(filePath), { recursive: true });

  const payload: AnalysisSessionSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export async function clearSessionOnDisk(workspaceRoot = process.cwd()): Promise<void> {
  const filePath = sessionFilePath(workspaceRoot);
  try {
    await writeFile(
      filePath,
      JSON.stringify(
        {
          jobUrl: "",
          jobDescription: "",
          parsedJob: null,
          matchResult: null,
          generatedCV: null,
          generatedCoverLetter: null,
          originalCV: null,
          originalCoverLetter: null,
          analysisMode: null,
          cvLanguage: null,
          updatedAt: new Date().toISOString(),
        } satisfies AnalysisSessionSnapshot,
        null,
        2
      ),
      "utf8"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
}
