import {
  expandTermAliases,
  normalizeTerm,
  termAppearsInText,
} from "@/lib/jobDictionaries";
import type { MasterCV, ParsedJob, ScoreBreakdown } from "@/types";

/** Recruiter-style categories — weights sum to 100. */
export const SCORE_WEIGHTS = {
  skillsMatch: 30,
  experienceMatch: 20,
  location: 15,
  language: 10,
  juniorFriendliness: 15,
  portfolioRelevance: 10,
} as const;

export interface TermMatchContext {
  cvTerms: string[];
  termMatchesCV: (jobTerm: string) => boolean;
}

const JUNIOR_JOB_TERMS = [
  "junior",
  "trainee",
  "graduate",
  "entry level",
  "entry-level",
  "student",
  "praktik",
  "intern",
  "starter",
  "nyuddannet",
];

const SENIOR_JOB_TERMS = [
  "senior",
  "lead",
  "principal",
  "architect",
  "5+ years",
  "7+ years",
  "10+ years",
];

const REMOTE_TERMS = ["remote", "hybrid", "hjemmearbejde", "fjernarbejde"];

const DENMARK_TERMS = [
  "denmark",
  "danmark",
  "copenhagen",
  "københavn",
  "kastrup",
  "danish",
  "dansk",
];

export function buildCVTerms(cv: MasterCV): string[] {
  const terms = new Set<string>();

  cv.skills.forEach((s) => terms.add(normalizeTerm(s)));
  cv.tools.forEach((t) => terms.add(normalizeTerm(t)));

  cv.experience.forEach((exp) => {
    terms.add(normalizeTerm(exp.title));
    terms.add(normalizeTerm(exp.company));
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
      terms.add(normalizeTerm(project.name));
      [...cv.skills, ...cv.tools].forEach((term) => {
        if (termAppearsInText(term, project.description)) {
          terms.add(normalizeTerm(term));
        }
      });
    });
  }

  cv.certifications?.forEach((cert) => terms.add(normalizeTerm(cert)));

  cv.languages?.forEach((lang) => {
    expandTermAliases(lang.language).forEach((variant) => terms.add(variant));
  });

  return Array.from(terms).filter(Boolean);
}

export function createTermMatcher(cvTerms: string[]) {
  const expandedCV = new Set(cvTerms.flatMap((term) => expandTermAliases(term)));

  return (jobTerm: string): boolean => {
    const jobVariants = expandTermAliases(jobTerm);

    return jobVariants.some((jobVariant) => {
      if (expandedCV.has(jobVariant)) return true;

      return [...expandedCV].some(
        (cvTerm) =>
          cvTerm === jobVariant ||
          cvTerm.includes(jobVariant) ||
          jobVariant.includes(cvTerm) ||
          termAppearsInText(jobVariant, cvTerm) ||
          termAppearsInText(cvTerm, jobVariant)
      );
    });
  };
}

function scoreCategory(
  matched: number,
  total: number,
  weight: number
): ScoreBreakdown["skillsMatch"] {
  if (total === 0) {
    return { matched: 0, total: 0, weight, score: 0 };
  }

  const score = Math.round((matched / total) * 100);
  return { matched, total, weight, score };
}

function weightedOverall(breakdown: Omit<ScoreBreakdown, "overall">): number {
  const categories = [
    breakdown.skillsMatch,
    breakdown.experienceMatch,
    breakdown.location,
    breakdown.language,
    breakdown.juniorFriendliness,
    breakdown.portfolioRelevance,
  ];

  const active = categories.filter((c) => c.total > 0);
  if (active.length === 0) return 0;

  const totalWeight = active.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = active.reduce((sum, c) => sum + c.score * c.weight, 0);

  return Math.round(weightedSum / totalWeight);
}

function scoreTermList(
  terms: string[],
  termMatchesCV: (term: string) => boolean,
  weight: number
): ScoreBreakdown["skillsMatch"] {
  const unique = Array.from(
    new Set(terms.map((t) => normalizeTerm(t)).filter(Boolean))
  );
  const matched = unique.filter(termMatchesCV).length;
  return scoreCategory(matched, unique.length, weight);
}

function scoreSkillsMatch(
  job: ParsedJob,
  termMatchesCV: (term: string) => boolean
): ScoreBreakdown["skillsMatch"] {
  const skillAndToolTerms = [...job.skills, ...job.tools];
  return scoreTermList(
    skillAndToolTerms,
    termMatchesCV,
    SCORE_WEIGHTS.skillsMatch
  );
}

function scoreExperienceMatch(
  job: ParsedJob,
  cv: MasterCV
): ScoreBreakdown["experienceMatch"] {
  const jobText = normalizeTerm(
    [job.title, ...job.responsibilities, ...job.requirements].join(" ")
  );

  const experienceSignals = cv.experience.flatMap((exp) => [
    exp.title,
    exp.company,
    ...exp.bullets,
  ]);

  if (experienceSignals.length === 0) {
    return scoreCategory(0, 0, SCORE_WEIGHTS.experienceMatch);
  }

  const matchedSignals = experienceSignals.filter((signal) =>
    termAppearsInText(signal, jobText)
  ).length;

  const titleOverlap = cv.experience.some((exp) => {
    const expTitle = normalizeTerm(exp.title);
    const jobTitle = normalizeTerm(job.title);
    return (
      termAppearsInText(expTitle, jobTitle) ||
      termAppearsInText(jobTitle, expTitle)
    );
  });

  const matched = matchedSignals + (titleOverlap ? 2 : 0);
  const total = experienceSignals.length + 2;

  return scoreCategory(matched, total, SCORE_WEIGHTS.experienceMatch);
}

function scoreLocation(job: ParsedJob, cv: MasterCV): ScoreBreakdown["location"] {
  const jobLocation = normalizeTerm(job.location);
  const cvLocations = [
    cv.personalInfo.location,
    ...cv.experience.map((exp) => exp.location),
  ]
    .map(normalizeTerm)
    .filter(Boolean);

  if (!jobLocation || jobLocation === "not detected") {
    return scoreCategory(1, 1, SCORE_WEIGHTS.location);
  }

  if (REMOTE_TERMS.some((term) => jobLocation.includes(term))) {
    return scoreCategory(1, 1, SCORE_WEIGHTS.location);
  }

  const jobInDenmark = DENMARK_TERMS.some((term) => jobLocation.includes(term));
  const cvInDenmark = cvLocations.some((loc) =>
    DENMARK_TERMS.some((term) => loc.includes(term))
  );

  if (jobInDenmark && cvInDenmark) {
    return scoreCategory(1, 1, SCORE_WEIGHTS.location);
  }

  const locationOverlap = cvLocations.some(
    (loc) =>
      loc.includes(jobLocation) ||
      jobLocation.includes(loc) ||
      termAppearsInText(loc, jobLocation)
  );

  if (locationOverlap) {
    return scoreCategory(1, 1, SCORE_WEIGHTS.location);
  }

  if (jobInDenmark || cvInDenmark) {
    return scoreCategory(1, 2, SCORE_WEIGHTS.location);
  }

  return scoreCategory(0, 1, SCORE_WEIGHTS.location);
}

function scoreLanguage(job: ParsedJob, cv: MasterCV): ScoreBreakdown["language"] {
  const jobText = normalizeTerm(job.rawText);
  const cvLanguages = (cv.languages ?? []).map((l) => normalizeTerm(l.language));

  const requiresDanish =
    jobText.includes("dansk") ||
    jobText.includes("danish") ||
    jobText.includes("modersmål");
  const requiresEnglish =
    jobText.includes("engelsk") ||
    jobText.includes("english") ||
    jobText.includes("forhandlingsniveau");

  const requirements: string[] = [];
  if (requiresDanish) requirements.push("dansk");
  if (requiresEnglish) requirements.push("engelsk");

  if (requirements.length === 0) {
    return scoreCategory(1, 1, SCORE_WEIGHTS.language);
  }

  const matched = requirements.filter((req) =>
    cvLanguages.some(
      (lang) => lang.includes(req) || termAppearsInText(req, lang)
    )
  ).length;

  return scoreCategory(matched, requirements.length, SCORE_WEIGHTS.language);
}

function scoreJuniorFriendliness(
  job: ParsedJob,
  cv: MasterCV
): ScoreBreakdown["juniorFriendliness"] {
  const jobText = normalizeTerm(
    [job.title, job.rawText, ...job.requirements].join(" ")
  );

  const isJuniorRole = JUNIOR_JOB_TERMS.some((term) => jobText.includes(term));
  const isSeniorRole = SENIOR_JOB_TERMS.some((term) => jobText.includes(term));

  const recentEducation = cv.education.some((edu) => {
    const endYear = parseInt(edu.endDate, 10);
    return !Number.isNaN(endYear) && endYear >= new Date().getFullYear() - 3;
  });

  const hasStudentExperience = cv.experience.some((exp) => {
    const title = normalizeTerm(exp.title);
    return (
      title.includes("student") ||
      title.includes("praktik") ||
      title.includes("trainee")
    );
  });

  const cvProfileIsJunior = recentEducation || hasStudentExperience;

  if (isSeniorRole && !cvProfileIsJunior) {
    return scoreCategory(0, 1, SCORE_WEIGHTS.juniorFriendliness);
  }

  if (isSeniorRole && cvProfileIsJunior) {
    return scoreCategory(0, 1, SCORE_WEIGHTS.juniorFriendliness);
  }

  if (isJuniorRole && cvProfileIsJunior) {
    return scoreCategory(1, 1, SCORE_WEIGHTS.juniorFriendliness);
  }

  if (cvProfileIsJunior) {
    return scoreCategory(1, 1, SCORE_WEIGHTS.juniorFriendliness);
  }

  return scoreCategory(1, 1, SCORE_WEIGHTS.juniorFriendliness);
}

function scorePortfolioRelevance(
  job: ParsedJob,
  cv: MasterCV,
  termMatchesCV: (term: string) => boolean
): ScoreBreakdown["portfolioRelevance"] {
  const projects = cv.projects ?? [];
  if (projects.length === 0) {
    return scoreCategory(0, 0, SCORE_WEIGHTS.portfolioRelevance);
  }

  const jobTerms = Array.from(
    new Set(
      [...job.skills, ...job.tools, ...job.atsKeywords]
        .map((t) => normalizeTerm(t))
        .filter(Boolean)
    )
  );

  if (jobTerms.length === 0) {
    return scoreCategory(0, 0, SCORE_WEIGHTS.portfolioRelevance);
  }

  const matchedTerms = jobTerms.filter(termMatchesCV).length;
  return scoreCategory(
    matchedTerms,
    jobTerms.length,
    SCORE_WEIGHTS.portfolioRelevance
  );
}

/**
 * Recruiter-style 0–100 score across six weighted categories.
 */
export function scoreJob(job: ParsedJob, cv: MasterCV): ScoreBreakdown {
  const cvTerms = buildCVTerms(cv);
  const termMatchesCV = createTermMatcher(cvTerms);

  const partial = {
    skillsMatch: scoreSkillsMatch(job, termMatchesCV),
    experienceMatch: scoreExperienceMatch(job, cv),
    location: scoreLocation(job, cv),
    language: scoreLanguage(job, cv),
    juniorFriendliness: scoreJuniorFriendliness(job, cv),
    portfolioRelevance: scorePortfolioRelevance(job, cv, termMatchesCV),
  };

  const overall = weightedOverall(partial);

  return { ...partial, overall };
}

export function scoreSummary(overall: number): string {
  if (overall >= 75) return "Strong alignment with your verified CV profile.";
  if (overall >= 50)
    return "Moderate match. Emphasize overlapping verified experience when tailoring your CV.";
  if (overall >= 25)
    return "Partial match. Review gaps and focus on verified strengths you already have.";
  return "Limited overlap. Use recommended focus areas to prioritize honest, verified highlights.";
}
