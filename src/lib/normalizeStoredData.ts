import type { Application, ApplicationStatus, MatchResult, ParsedJob } from "@/types";

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

export function normalizeMatchResult(value: unknown): MatchResult | null {
  if (!value || typeof value !== "object") return null;

  const match = value as Partial<MatchResult>;
  return {
    score: typeof match.score === "number" ? match.score : 0,
    matchedKeywords: normalizeStringArray(match.matchedKeywords),
    missingKeywords: normalizeStringArray(match.missingKeywords),
    recommendedFocusAreas: normalizeStringArray(match.recommendedFocusAreas),
    summary: match.summary ?? "",
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
