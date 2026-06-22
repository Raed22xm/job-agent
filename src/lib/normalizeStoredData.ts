import type {
  Application,
  ApplicationStatus,
  CategoryScore,
  CoverLetterStatus,
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

const VALID_COVER_LETTER_STATUSES: CoverLetterStatus[] = [
  "none",
  "draft",
  "ready",
  "sent",
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

  const breakdown = value as Partial<ScoreBreakdown> & {
    skills?: unknown;
    tools?: unknown;
    keywords?: unknown;
  };

  const skillsMatch = normalizeCategoryScore(
    breakdown.skillsMatch ?? breakdown.skills
  );
  const experienceMatch = normalizeCategoryScore(breakdown.experienceMatch);
  const location = normalizeCategoryScore(breakdown.location);
  const language = normalizeCategoryScore(breakdown.language);
  const juniorFriendliness = normalizeCategoryScore(
    breakdown.juniorFriendliness
  );
  const portfolioRelevance = normalizeCategoryScore(
    breakdown.portfolioRelevance ?? breakdown.keywords
  );

  if (
    !skillsMatch ||
    !experienceMatch ||
    !location ||
    !language ||
    !juniorFriendliness ||
    !portfolioRelevance ||
    typeof breakdown.overall !== "number"
  ) {
    return undefined;
  }

  return {
    skillsMatch,
    experienceMatch,
    location,
    language,
    juniorFriendliness,
    portfolioRelevance,
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

  const coverLetterStatus = VALID_COVER_LETTER_STATUSES.includes(
    app.coverLetterStatus as CoverLetterStatus
  )
    ? (app.coverLetterStatus as CoverLetterStatus)
    : "none";

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
    company:
      typeof app.company === "string" && app.company
        ? app.company
        : job.company,
    jobTitle:
      typeof app.jobTitle === "string" && app.jobTitle
        ? app.jobTitle
        : job.title,
    link:
      typeof app.link === "string"
        ? app.link
        : job.sourceUrl,
    location:
      typeof app.location === "string" && app.location
        ? app.location
        : job.location,
    deadline: typeof app.deadline === "string" ? app.deadline : undefined,
    matchScore:
      typeof app.matchScore === "number" ? app.matchScore : match.score,
    cvVersion: typeof app.cvVersion === "string" ? app.cvVersion : undefined,
    coverLetterStatus,
    recruiterContact:
      typeof app.recruiterContact === "string" ? app.recruiterContact : undefined,
    appliedDate: typeof app.appliedDate === "string" ? app.appliedDate : undefined,
    followUpDate:
      typeof app.followUpDate === "string" ? app.followUpDate : undefined,
  };
}
