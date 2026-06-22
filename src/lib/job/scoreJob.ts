import { normalizeTerm, termAppearsInText } from "@/lib/jobDictionaries";
import type { MasterCV, ParsedJob, ScoreBreakdown } from "@/types";

/** Weighted categories inspired by ATS scoring best practices. */
export const SCORE_WEIGHTS = {
  skills: 3,
  tools: 2,
  keywords: 1,
} as const;

export interface TermMatchContext {
  cvTerms: string[];
  termMatchesCV: (jobTerm: string) => boolean;
}

export function buildCVTerms(cv: MasterCV): string[] {
  const terms = new Set<string>();

  cv.skills.forEach((s) => terms.add(normalizeTerm(s)));
  cv.tools.forEach((t) => terms.add(normalizeTerm(t)));

  cv.experience.forEach((exp) => {
    terms.add(normalizeTerm(exp.title));
    exp.bullets.forEach((bullet) => {
      [...cv.skills, ...cv.tools].forEach((term) => {
        if (termAppearsInText(term, bullet)) {
          terms.add(normalizeTerm(term));
        }
      });
    });
  });

  if (cv.projects) {
    cv.projects.forEach((project) => {
      [...cv.skills, ...cv.tools].forEach((term) => {
        if (termAppearsInText(term, project.description)) {
          terms.add(normalizeTerm(term));
        }
      });
    });
  }

  cv.certifications?.forEach((cert) => terms.add(normalizeTerm(cert)));

  return Array.from(terms).filter(Boolean);
}

export function createTermMatcher(cvTerms: string[]) {
  return (jobTerm: string): boolean =>
    cvTerms.some((cvTerm) => {
      if (jobTerm === cvTerm) return true;
      if (cvTerm.includes(jobTerm) || jobTerm.includes(cvTerm)) return true;
      return (
        termAppearsInText(jobTerm, cvTerm) || termAppearsInText(cvTerm, jobTerm)
      );
    });
}

function scoreCategory(
  terms: string[],
  termMatchesCV: (term: string) => boolean,
  weight: number
): ScoreBreakdown["skills"] {
  const unique = Array.from(
    new Set(terms.map((t) => normalizeTerm(t)).filter(Boolean))
  );

  if (unique.length === 0) {
    return { matched: 0, total: 0, weight, score: 0 };
  }

  const matched = unique.filter(termMatchesCV).length;
  const score = Math.round((matched / unique.length) * 100);

  return { matched, total: unique.length, weight, score };
}

function weightedOverall(breakdown: Omit<ScoreBreakdown, "overall">): number {
  const categories = [breakdown.skills, breakdown.tools, breakdown.keywords];
  const active = categories.filter((c) => c.total > 0);

  if (active.length === 0) return 0;

  const totalWeight = active.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = active.reduce((sum, c) => sum + c.score * c.weight, 0);

  return Math.round(weightedSum / totalWeight);
}

/**
 * Weighted ATS score: skills (3×), tools (2×), ATS keywords (1×).
 * Keywords already present in skills/tools are deduplicated for the keywords category.
 */
export function scoreJob(job: ParsedJob, cv: MasterCV): ScoreBreakdown {
  const cvTerms = buildCVTerms(cv);
  const termMatchesCV = createTermMatcher(cvTerms);

  const skillTerms = job.skills.map(normalizeTerm);
  const toolTerms = job.tools.map(normalizeTerm);

  const skillAndToolNorm = new Set([...skillTerms, ...toolTerms]);
  const keywordTerms = job.atsKeywords
    .map(normalizeTerm)
    .filter((term) => term && !skillAndToolNorm.has(term));

  const skills = scoreCategory(skillTerms, termMatchesCV, SCORE_WEIGHTS.skills);
  const tools = scoreCategory(toolTerms, termMatchesCV, SCORE_WEIGHTS.tools);
  const keywords = scoreCategory(
    keywordTerms,
    termMatchesCV,
    SCORE_WEIGHTS.keywords
  );

  const partial = { skills, tools, keywords };
  const overall = weightedOverall(partial);

  return { ...partial, overall };
}

export function scoreSummary(overall: number): string {
  if (overall >= 75) return "Strong alignment with your verified CV keywords.";
  if (overall >= 50)
    return "Moderate match. Emphasize overlapping verified experience when tailoring your CV.";
  if (overall >= 25)
    return "Partial match. Review missing terms and focus on verified strengths you already have.";
  return "Limited keyword overlap. Use recommended focus areas to prioritize honest, verified highlights.";
}
