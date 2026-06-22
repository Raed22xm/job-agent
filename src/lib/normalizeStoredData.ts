import type {
  Application,
  ApplicationStatus,
  CategoryScore,
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
  ScoreBreakdown,
} from "@/types";

const VALID_STATUSES: ApplicationStatus[] = [
  "draft",
  "ready",
  "applied",
  "interview",
  "rejected",
  "offer",
];

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeParsedJob(value: unknown): ParsedJob | null {
  if (!value || typeof value !== "object") return null;

  const job = value as Partial<ParsedJob>;
  if (!job.title && !job.company && !job.rawText) return null;

  return {
    title: job.title ?? "Role title not detected",
    company: job.company ?? "Not detected",
    location: job.location ?? "Not detected",
    responsibilities: normalizeStringArray(job.responsibilities),
    requirements: normalizeStringArray(job.requirements),
    tools: normalizeStringArray(job.tools),
    skills: normalizeStringArray(job.skills),
    atsKeywords: normalizeStringArray(job.atsKeywords),
    rawText: job.rawText ?? "",
    sourceUrl: typeof job.sourceUrl === "string" ? job.sourceUrl : undefined,
  };
}

function normalizeCategoryScore(value: unknown): CategoryScore | null {
  if (!value || typeof value !== "object") return null;

  const score = value as Partial<CategoryScore>;
  if (
    typeof score.matched !== "number" ||
    typeof score.total !== "number" ||
    typeof score.weight !== "number" ||
    typeof score.score !== "number"
  ) {
    return null;
  }

  return {
    matched: score.matched,
    total: score.total,
    weight: score.weight,
    score: score.score,
  };
}

export function normalizeScoreBreakdown(value: unknown): ScoreBreakdown | undefined {
  if (!value || typeof value !== "object") return undefined;

  const breakdown = value as Partial<ScoreBreakdown>;
  const skills = normalizeCategoryScore(breakdown.skills);
  const tools = normalizeCategoryScore(breakdown.tools);
  const keywords = normalizeCategoryScore(breakdown.keywords);

  if (
    !skills ||
    !tools ||
    !keywords ||
    typeof breakdown.overall !== "number"
  ) {
    return undefined;
  }

  return {
    skills,
    tools,
    keywords,
    overall: breakdown.overall,
  };
}

export function normalizeMatchResult(value: unknown): MatchResult | null {
  if (!value || typeof value !== "object") return null;

  const match = value as Partial<MatchResult>;
  return {
    score: typeof match.score === "number" ? match.score : 0,
    matchedKeywords: normalizeStringArray(match.matchedKeywords),
    missingKeywords: normalizeStringArray(match.missingKeywords),
    recommendedFocusAreas: normalizeStringArray(match.recommendedFocusAreas),
    summary: match.summary ?? "",
    scoreBreakdown: normalizeScoreBreakdown(match.scoreBreakdown),
  };
}

export function normalizeGeneratedCV(value: unknown): GeneratedCV | null {
  if (!value || typeof value !== "object") return null;

  const cv = value as Partial<GeneratedCV>;
  const sections = cv.sections;
  if (!sections || typeof sections !== "object") return null;

  const header = (sections as GeneratedCV["sections"]).header;
  if (!header || typeof header.fullName !== "string") return null;

  return {
    sections: {
      header,
      summary:
        typeof (sections as GeneratedCV["sections"]).summary === "string"
          ? (sections as GeneratedCV["sections"]).summary
          : "",
      skills: normalizeStringArray((sections as GeneratedCV["sections"]).skills),
      experience: Array.isArray((sections as GeneratedCV["sections"]).experience)
        ? (sections as GeneratedCV["sections"]).experience.filter(
            (item): item is GeneratedCV["sections"]["experience"][number] =>
              Boolean(item && typeof item === "object" && typeof item.id === "string")
          )
        : [],
      education: Array.isArray((sections as GeneratedCV["sections"]).education)
        ? (sections as GeneratedCV["sections"]).education.filter(
            (item): item is GeneratedCV["sections"]["education"][number] =>
              Boolean(item && typeof item === "object" && typeof item.id === "string")
          )
        : [],
    },
    atsNotes: normalizeStringArray(cv.atsNotes),
  };
}

export function normalizeGeneratedCoverLetter(
  value: unknown
): GeneratedCoverLetter | null {
  if (!value || typeof value !== "object") return null;

  const letter = value as Partial<GeneratedCoverLetter>;
  if (typeof letter.greeting !== "string" || typeof letter.signature !== "string") {
    return null;
  }

  return {
    greeting: letter.greeting,
    paragraphs: normalizeStringArray(letter.paragraphs),
    closing: typeof letter.closing === "string" ? letter.closing : "",
    signature: letter.signature,
  };
}

export function normalizeApplication(value: unknown): Application | null {
  if (!value || typeof value !== "object") return null;

  const app = value as Partial<Application>;
  if (typeof app.id !== "string" || !app.id) return null;

  const job = normalizeParsedJob(app.job);
  const match = normalizeMatchResult(app.match);
  if (!job || !match) return null;

  const status = VALID_STATUSES.includes(app.status as ApplicationStatus)
    ? (app.status as ApplicationStatus)
    : "draft";

  return {
    id: app.id,
    createdAt:
      typeof app.createdAt === "string" ? app.createdAt : new Date().toISOString(),
    updatedAt:
      typeof app.updatedAt === "string" ? app.updatedAt : new Date().toISOString(),
    job,
    match,
    status,
    notes: typeof app.notes === "string" ? app.notes : undefined,
  };
}
