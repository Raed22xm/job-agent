import masterCV from "../../data/master-cv.json";
import {
  isLanguageTerm,
  normalizeTerm,
  termAppearsInText,
  termsAreEquivalent,
} from "@/lib/jobDictionaries";
import {
  buildCVTerms,
  createTermMatcher,
  scoreJob,
  scoreSummary,
} from "@/lib/job/scoreJob";
import type { MasterCV, MatchResult, ParsedJob } from "@/types";

function collectCVTerms(cv: MasterCV): {
  terms: string[];
  sources: Map<string, string[]>;
} {
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

  if (cv.projects) {
    cv.projects.forEach((project) => {
      [...cv.skills, ...cv.tools].forEach((term) => {
        if (termAppearsInText(term, project.description)) {
          addSource(term, `Project: ${project.name}`);
        }
      });
    });
  }

  cv.certifications?.forEach((cert) =>
    addSource(cert, `Certification: ${cert}`)
  );

  cv.languages?.forEach((lang) =>
    addSource(lang.language, `Language: ${lang.language} (${lang.level})`)
  );

  return { terms: buildCVTerms(cv), sources };
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

function displayTerm(term: string, job: ParsedJob): string {
  const all = [...job.skills, ...job.tools, ...job.atsKeywords];
  return (
    all.find((item) => normalizeTerm(item) === term) ??
    term.charAt(0).toUpperCase() + term.slice(1)
  );
}

function cvCoversLanguageRequirement(term: string, cv: MasterCV): boolean {
  if (!isLanguageTerm(term)) return false;

  const cvLanguages = (cv.languages ?? []).map((entry) => entry.language);
  return cvLanguages.some((language) => termsAreEquivalent(language, term));
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
 * Uses weighted scoring via scoreJob(). Does not invent skills or experience.
 */
export function matchCV(
  job: ParsedJob,
  cv: MasterCV = masterCV as MasterCV
): MatchResult {
  const { terms: cvTerms, sources } = collectCVTerms(cv);
  const terms = jobTerms(job);
  const termMatchesCV = createTermMatcher(cvTerms);

  if (terms.length === 0) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      recommendedFocusAreas: [
        "No ATS keywords were detected in the job text. Try pasting a fuller description with skills and requirements sections.",
      ],
      summary:
        "Unable to score — no extractable keywords found in the job description.",
    };
  }

  const matchedNormalized = terms.filter(termMatchesCV);
  const missingNormalized = terms
    .filter((term) => !matchedNormalized.includes(term))
    .filter((term) => !cvCoversLanguageRequirement(term, cv));

  const matchedKeywords = matchedNormalized.map((term) => displayTerm(term, job));
  const missingKeywords = missingNormalized.map((term) => displayTerm(term, job));

  const scoreBreakdown = scoreJob(job, cv);
  const score = scoreBreakdown.overall;
  const summary = scoreSummary(score);

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
    scoreBreakdown,
  };
}

export function getMasterCV(): MasterCV {
  return masterCV as MasterCV;
}
