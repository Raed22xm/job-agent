import { tailorExperienceForJob } from "@/lib/cv/tailorExperience";
import type { Experience, GeneratedCV, MasterCV, MatchResult, ParsedJob, Project } from "@/types";

function metricStrength(bullet: string): number {
  const outcome = /%|procent|percent|reduc|increase|improv|save|spare|time|timer|uptime|oppetid|tilfredshed/iu;
  const numericClaims = bullet.match(/\d+(?:[.,]\d+)?\s*(?:%|\+)?/gu)?.length ?? 0;
  return (outcome.test(bullet) ? 100 : 0) + numericClaims;
}

export function isQuantifiedAchievement(bullet: string): boolean {
  if (!/\d/u.test(bullet)) return false;
  if (/\d+(?:[.,]\d+)?\s*%|\d+\s*\+/u.test(bullet)) return true;
  if (/\b(reduc|increase|improv|save|spare|grew|growth|uptime|oppetid|tilfredshed|frafald|rapporteringstid)\p{L}*\b/iu.test(bullet)) {
    return true;
  }
  if (/\d+(?:[.,]\d+)?\s*(?:hours?|timer|min(?:utes?|utter)?|seconds?|sekunder?|days?|dage|weeks?|uger|months?|måneder|years?|år|dkk|kr\.?|eur|usd)\b/iu.test(bullet)) {
    return true;
  }
  const deliveredCount = /\d+\s+(?:[\p{L}/&-]+\s+){0,3}(?:dashboards?|endpoints?|shipments?|forsendelser|interviews?|workshops?|projects?|projekter|users?|brugere|customers?|kunder|reports?|rapporter|features?|tests?|deployments?|releases?|teams?|countries|lande)\b/iu;
  return deliveredCount.test(bullet);
}

export function findVerifiedQuantifiedAchievement(
  cv: MasterCV,
  experience: Experience[]
): string | null {
  const verifiedById = new Map(
    cv.experience.map((entry) => [entry.id, new Set(entry.bullets.map((bullet) => bullet.trim()))])
  );
  for (const entry of experience) {
    const verified = verifiedById.get(entry.id);
    if (!verified) continue;
    const candidates = entry.bullets
      .map((bullet, index) => ({ bullet: bullet.trim(), index }))
      .filter(({ bullet }) => isQuantifiedAchievement(bullet) && verified.has(bullet))
      .sort((a, b) => metricStrength(b.bullet) - metricStrength(a.bullet) || a.index - b.index);
    if (candidates[0]) return candidates[0].bullet;
  }
  return null;
}

export function buildProfessionalSummary(
  cv: MasterCV,
  experience: Experience[] = []
): string {
  const achievement = findVerifiedQuantifiedAchievement(cv, experience);
  return buildSummaryWithAchievement(cv, achievement);
}

function buildSummaryWithAchievement(
  cv: MasterCV,
  achievement: string | null
): string {
  const {
    professionalBackground,
    professionalMotivation,
    coreCompetencies,
    personalStrengths,
  } = cv.professionalSummary;

  const baseSummary = [
    professionalBackground,
    professionalMotivation,
    coreCompetencies,
    personalStrengths,
  ]
    .map((element) => element.trim())
    .join(" ");
  if (!achievement) return baseSummary;
  const isDanish = /^Jeg\b/iu.test(professionalMotivation.trim());
  const trimmedClaim = achievement.replace(/[.!?;:]+$/u, "").trim();
  const withoutPronoun = isDanish
    ? trimmedClaim.replace(/^Jeg\s+/iu, "")
    : trimmedClaim.replace(/^I\s+/u, "");
  const claim = /^[A-ZÆØÅ][a-zæøå]/u.test(withoutPronoun)
    ? withoutPronoun.charAt(0).toLocaleLowerCase() + withoutPronoun.slice(1)
    : withoutPronoun;
  const achievementSentence = isDanish
    ? `Et dokumenteret resultat fra min erfaring er, at jeg ${claim}.`
    : `A verified result from my experience is that I ${claim}.`;
  return `${baseSummary} ${achievementSentence}`;
}

export function verifiedProfessionalSummaryCandidates(cv: MasterCV): string[] {
  const quantified = Array.from(new Set(
    cv.experience.flatMap((entry) => entry.bullets)
      .map((bullet) => bullet.trim())
      .filter(isQuantifiedAchievement)
  ));
  return quantified.length > 0
    ? quantified.map((bullet) => buildSummaryWithAchievement(cv, bullet))
    : [buildSummaryWithAchievement(cv, null)];
}

/**
 * Tailors verified CV content for ATS: skill order, experience/bullet order, relevant projects.
 * Does not invent experience, metrics, or skills.
 */
export function generateCV(
  cv: MasterCV,
  job: ParsedJob,
  match: MatchResult
): GeneratedCV {
  const jobKeywordSet = new Set(
    [...job.atsKeywords, ...job.skills, ...job.tools].map((k) => k.toLowerCase())
  );

  const prioritizedSkills = [
    ...cv.skills.filter(
      (skill) =>
        jobKeywordSet.has(skill.toLowerCase()) ||
        match.matchedKeywords.some((kw) => skill.toLowerCase().includes(kw))
    ),
    ...cv.skills.filter(
      (skill) =>
        !jobKeywordSet.has(skill.toLowerCase()) &&
        !match.matchedKeywords.some((kw) => skill.toLowerCase().includes(kw))
    ),
  ];

  const tailoredExperience = tailorExperienceForJob(cv.experience, job, match);
  const relevantProjects = selectRelevantProjects(cv.projects ?? [], job, match);

  const atsNotes = [
    "One-column ATS-friendly layout.",
    "Professional summary preserves all four verified elements in source order.",
    "Only verified CV data — experience bullets reordered by job relevance.",
    match.missingKeywords.length
      ? `Gaps to address honestly: ${match.missingKeywords.slice(0, 5).join(", ")}.`
      : "Strong keyword coverage from your existing CV.",
  ];

  return {
    sections: {
      header: cv.personalInfo,
      summary: buildProfessionalSummary(cv, tailoredExperience),
      skills: prioritizedSkills,
      experience: tailoredExperience,
      education: cv.education,
      ...(relevantProjects.length > 0 ? { projects: relevantProjects } : {}),
    },
    atsNotes,
  };
}

function selectRelevantProjects(
  projects: Project[],
  job: ParsedJob,
  match: MatchResult
): Project[] {
  if (projects.length === 0) return [];

  const jobTerms = new Set(
    [...job.atsKeywords, ...job.skills, ...job.tools, ...match.matchedKeywords].map(
      (term) => term.toLowerCase()
    )
  );

  // Score each project based on how many job keywords it matches
  const scoredProjects = projects.map((project) => {
    const text = `${project.name} ${project.description}`.toLowerCase();
    let score = 0;
    
    for (const term of jobTerms) {
      if (term.length > 2 && text.includes(term)) {
        score++;
      }
    }
    
    return { project, score };
  });

  // Sort projects by score (highest match first)
  scoredProjects.sort((a, b) => b.score - a.score);

  // Return all projects that have at least one keyword match.
  // If no projects match any keywords, return the top 2 default projects.
  const relevant = scoredProjects.filter((p) => p.score > 0).map((p) => p.project);

  return relevant.length > 0 ? relevant : projects.slice(0, 2);
}
