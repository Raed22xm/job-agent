import type {
  Application,
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
} from "@/types";
import { enrichApplicationWithJobMeta } from "@/lib/jobnet/enrichApplicationMeta";
import { refreshParsedJob } from "@/lib/parseJob";

export const SESSION_CURRENT_ID = "__session_current__";

export function applicationIdentity(job: Pick<ParsedJob, "company" | "title" | "sourceUrl">): string {
  const company = job.company.trim().toLowerCase();
  const title = job.title.trim().toLowerCase();
  const url = (job.sourceUrl ?? "").trim().toLowerCase();
  return `${company}|${title}|${url}`;
}

export function findMatchingApplication(
  applications: Application[],
  parsedJob: ParsedJob
): Application | undefined {
  const identity = applicationIdentity(parsedJob);
  return applications.find((app) => applicationIdentity(app.job) === identity);
}

export function buildDraftApplicationFromSession(
  parsedJob: ParsedJob,
  matchResult: MatchResult,
  options: {
    generatedCV?: GeneratedCV | null;
    generatedCoverLetter?: GeneratedCoverLetter | null;
  } = {}
): Application {
  const now = new Date().toISOString();
  const job = refreshParsedJob(parsedJob);
  return enrichApplicationWithJobMeta({
    id: SESSION_CURRENT_ID,
    createdAt: now,
    updatedAt: now,
    job,
    match: matchResult,
    status: "draft",
    company: job.company,
    jobTitle: job.title,
    link: job.sourceUrl,
    location: job.location,
    matchScore: matchResult.score,
    cvVersion: options.generatedCV ? `session-${now.slice(0, 10)}` : undefined,
    coverLetterStatus: options.generatedCoverLetter ? "draft" : "none",
  });
}

/** Overlay latest analyzer session onto a saved tracker row (same job). */
export function mergeApplicationWithSession(
  saved: Application,
  parsedJob: ParsedJob,
  matchResult: MatchResult,
  options: {
    generatedCV?: GeneratedCV | null;
    generatedCoverLetter?: GeneratedCoverLetter | null;
    cvOutputPath?: string;
    coverLetterOutputPath?: string;
  } = {}
): Application {
  const now = new Date().toISOString();
  const job = refreshParsedJob(parsedJob);
  return enrichApplicationWithJobMeta({
    ...saved,
    updatedAt: now,
    job,
    match: matchResult,
    company: job.company,
    jobTitle: job.title,
    link: job.sourceUrl,
    location: job.location,
    matchScore: matchResult.score,
    cvVersion: options.cvOutputPath ?? saved.cvVersion,
    coverLetterOutputPath:
      options.coverLetterOutputPath ?? saved.coverLetterOutputPath,
    coverLetterStatus: options.generatedCoverLetter
      ? saved.coverLetterStatus === "none"
        ? "draft"
        : saved.coverLetterStatus
      : saved.coverLetterStatus,
  });
}

export function resolveJobnetSelection(
  applications: Application[],
  parsedJob: ParsedJob | null,
  matchResult: MatchResult | null,
  preferredId?: string
): string {
  if (
    preferredId &&
    (preferredId === SESSION_CURRENT_ID ||
      applications.some((app) => app.id === preferredId))
  ) {
    return preferredId;
  }

  if (parsedJob && matchResult) {
    const matching = findMatchingApplication(applications, parsedJob);
    if (matching) return matching.id;
    return SESSION_CURRENT_ID;
  }

  const needing = applications.filter(
    (app) =>
      (app.status === "applied" || app.status === "interview") && !app.jobnetLogged
  );
  if (needing.length > 0) return needing[0].id;
  if (applications.length > 0) return applications[0].id;
  return "";
}
