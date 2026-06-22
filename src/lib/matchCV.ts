import masterCV from "../../data/master-cv.json";
import { normalizeTerm, termAppearsInText } from "@/lib/jobDictionaries";
import type { MasterCV, MatchResult, ParsedJob } from "@/types";

function collectCVTerms(cv: MasterCV): { terms: string[]; sources: Map<string, string[]> } {
  const sources = new Map<string, string[]>();

  const addSource = (term: string, source: string) => {
    const key = normalizeTerm(term);
    const existing = sources.get(key) ?? [];
    if (!existing.includes(source)) {
      sources.set(key, [...existing, source]);
    }
  };

  cv.skills.forEach((skill) => addSource(skill, `Skill: ${skill}`));
  cv.tools.forEach((tool) => addSource(tool, `Tool: ${tool}`));
  cv.experience.forEach((exp) => {
    addSource(exp.title, `Role: ${exp.title} at ${exp.company}`);
    exp.bullets.forEach((bullet) => {
      [...cv.skills, ...cv.tools].forEach((term) => {
        if (termAppearsInText(term, bullet)) {
          addSource(term, `${exp.title} at ${exp.company}`);
        }
      });
    });
  });

  if (cv.certifications) {
    cv.certifications.forEach((cert) => addSource(cert, `Certification: ${cert}`));
  }

  return { terms: Array.from(sources.keys()), sources };
}

function jobTerms(job: ParsedJob): string[] {
  return Array.from(
    new Set(
      [...job.skills, ...job.tools, ...job.atsKeywords]
        .map((term) => normalizeTerm(term))
        .filter(Boolean)
    )
  );
}

function termMatchesCV(jobTerm: string, cvTerm: string): boolean {
  if (jobTerm === cvTerm) return true;
  if (cvTerm.includes(jobTerm) || jobTerm.includes(cvTerm)) return true;
  return termAppearsInText(jobTerm, cvTerm) || termAppearsInText(cvTerm, jobTerm);
}

function displayTerm(term: string, job: ParsedJob): string {
  const all = [...job.skills, ...job.tools, ...job.atsKeywords];
  return (
    all.find((item) => normalizeTerm(item) === term) ??
    term.charAt(0).toUpperCase() + term.slice(1)
  );
}

function buildRecommendedFocusAreas(
  job: ParsedJob,
  cv: MasterCV,
  matchedNormalized: string[],
  missingNormalized: string[],
  sources: Map<string, string[]>
): string[] {
  const areas: string[] = [];

  for (const term of matchedNormalized.slice(0, 6)) {
    const cvSources = sources.get(term) ?? [];
    const label = displayTerm(term, job);

    if (cvSources.length > 0) {
      areas.push(`Highlight verified ${label} experience (${cvSources[0]}).`);
    } else {
      areas.push(`Emphasize verified ${label} coverage from your master CV.`);
    }
  }

  if (matchedNormalized.length >= 3) {
    areas.push(
      `Prioritize your ${cv.experience[0]?.title ?? "most recent role"} bullets that overlap with this posting.`
    );
  }

  for (const term of missingNormalized.slice(0, 4)) {
    const label = displayTerm(term, job);
    areas.push(
      `"${label}" appears in the job posting but is not verified in your master CV — do not add it unless accurate.`
    );
  }

  if (job.responsibilities.length > 0 && matchedNormalized.length > 0) {
    areas.push(
      "Mirror the job's responsibility language using only facts already present in your CV."
    );
  }

  return Array.from(new Set(areas)).slice(0, 8);
}

/**
 * Compares extracted job terms against verified master CV data.
 * Does not invent skills or experience.
 */
export function matchCV(
  job: ParsedJob,
  cv: MasterCV = masterCV as MasterCV
): MatchResult {
  const { terms: cvTerms, sources } = collectCVTerms(cv);
  const terms = jobTerms(job);

  if (terms.length === 0) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      recommendedFocusAreas: [
        "No ATS keywords were detected in the job text. Try pasting a fuller description with skills and requirements sections.",
      ],
      summary: "Unable to score — no extractable keywords found in the job description.",
    };
  }

  const matchedNormalized = terms.filter((jobTerm) =>
    cvTerms.some((cvTerm) => termMatchesCV(jobTerm, cvTerm))
  );

  const missingNormalized = terms.filter(
    (jobTerm) => !matchedNormalized.includes(jobTerm)
  );

  const matchedKeywords = matchedNormalized.map((term) => displayTerm(term, job));
  const missingKeywords = missingNormalized.map((term) => displayTerm(term, job));

  const score = Math.round((matchedNormalized.length / terms.length) * 100);

  let summary: string;
  if (score >= 75) {
    summary = "Strong alignment with your verified CV keywords.";
  } else if (score >= 50) {
    summary =
      "Moderate match. Emphasize overlapping verified experience when tailoring your CV.";
  } else if (score >= 25) {
    summary =
      "Partial match. Review missing terms and focus on verified strengths you already have.";
  } else {
    summary =
      "Limited keyword overlap. Use recommended focus areas to prioritize honest, verified highlights.";
  }

  const recommendedFocusAreas = buildRecommendedFocusAreas(
    job,
    cv,
    matchedNormalized,
    missingNormalized,
    sources
  );

  return {
    score,
    matchedKeywords,
    missingKeywords,
    recommendedFocusAreas,
    summary,
  };
}

export function getMasterCV(): MasterCV {
  return masterCV as MasterCV;
}
