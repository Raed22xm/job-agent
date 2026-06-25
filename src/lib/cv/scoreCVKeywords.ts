import { normalizeTerm, termAppearsInText } from "@/lib/jobDictionaries";
import type { GeneratedCV, ParsedJob } from "@/types";

export interface CVKeywordCoverage {
  /** Percentage of job ATS terms found in the CV text (0–100). */
  score: number;
  matched: string[];
  missing: string[];
  total: number;
}

function collectJobTerms(job: ParsedJob): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const raw of [...job.atsKeywords, ...job.skills, ...job.tools]) {
    const norm = normalizeTerm(raw);
    if (!norm || norm.length < 2 || seen.has(norm)) continue;
    seen.add(norm);
    terms.push(raw.trim());
  }

  return terms;
}

function flattenCVText(cv: GeneratedCV): string {
  const parts: string[] = [
    cv.sections.summary,
    cv.sections.skills.join(" "),
    ...cv.sections.experience.flatMap((exp) => [
      exp.title,
      exp.company,
      ...exp.bullets,
    ]),
    ...cv.sections.education.flatMap((edu) => [edu.degree, edu.institution]),
  ];

  if (cv.sections.projects) {
    parts.push(
      ...cv.sections.projects.flatMap((p) => [p.name, p.description])
    );
  }

  return parts.join(" ");
}

/**
 * Measures how many job keywords appear in the generated CV text.
 * Uses the same term matching rules as job analysis (aliases, Danish/English).
 */
export function scoreCVKeywordCoverage(
  cv: GeneratedCV,
  job: ParsedJob
): CVKeywordCoverage {
  const terms = collectJobTerms(job);
  const cvText = flattenCVText(cv);

  if (terms.length === 0) {
    return { score: 100, matched: [], missing: [], total: 0 };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of terms) {
    if (termAppearsInText(term, cvText)) {
      matched.push(term);
    } else {
      missing.push(term);
    }
  }

  const score = Math.round((matched.length / terms.length) * 100);

  return { score, matched, missing, total: terms.length };
}
