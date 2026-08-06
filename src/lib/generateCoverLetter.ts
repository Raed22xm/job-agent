import type { CvLanguage } from "@/lib/cvLanguage";
import { buildGapSuggestions } from "@/lib/gapSuggestions";
import {
  termAppearsInText,
  termsAreEquivalent,
} from "@/lib/jobDictionaries";
import type {
  Experience,
  GeneratedCoverLetter,
  MasterCV,
  ParsedJob,
} from "@/types";

/**
 * Heuristic cover letter from verified CV facts. AI-enhanced version via POST /api/analyze-job?enhanceWithAI.
 */
function displayValue(value: string, fallback: string): string {
  const trimmed = value.trim();
  return !trimmed ||
    trimmed === "Not detected" ||
    trimmed === "Role title not detected"
    ? fallback
    : trimmed;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}+#./-]+/gu, " ").trim();
}

function stripFinalPunctuation(value: string): string {
  return value.trim().replace(/[.!?;:]+$/u, "");
}

function lowercaseFirstWord(value: string): string {
  if (!/^[A-ZÆØÅ][a-zæøå]/u.test(value)) return value;
  return value.charAt(0).toLocaleLowerCase() + value.slice(1);
}

function asMotivationClause(value: string, language: CvLanguage): string {
  const trimmed = stripFinalPunctuation(value);
  if (language === "english" && /^I\b/u.test(trimmed)) return trimmed;
  return lowercaseFirstWord(trimmed);
}

function asFirstPersonClause(value: string, language: CvLanguage): string {
  const trimmed = stripFinalPunctuation(value).replace(/^[-•]\s*/u, "");
  const withoutPronoun =
    language === "danish"
      ? trimmed.replace(/^jeg\s+/iu, "")
      : trimmed.replace(/^I\s+/u, "");

  return lowercaseFirstWord(withoutPronoun);
}

function jobText(job: ParsedJob): string {
  return normalize(
    [
      job.title,
      ...job.responsibilities,
      ...job.requirements,
      ...job.skills,
      ...job.tools,
      ...job.atsKeywords,
      job.rawText,
    ].join(" ")
  );
}

function jobKeywords(job: ParsedJob): Set<string> {
  const ignored = new Set([
    "and",
    "are",
    "for",
    "med",
    "som",
    "the",
    "til",
    "with",
  ]);

  return new Set(
    jobText(job)
      .split(" ")
      .filter((term) => term.length >= 3 && !ignored.has(term))
  );
}

function relevanceScore(value: string, keywords: Set<string>): number {
  return normalize(value)
    .split(" ")
    .reduce((score, term) => score + (keywords.has(term) ? 1 : 0), 0);
}

function bestExperience(cv: MasterCV, job: ParsedJob): Experience | undefined {
  const keywords = jobKeywords(job);

  return cv.experience.reduce<Experience | undefined>((best, experience) => {
    if (!best) return experience;

    const experienceText = [
      experience.title,
      experience.company,
      ...experience.bullets,
    ].join(" ");
    const bestText = [best.title, best.company, ...best.bullets].join(" ");

    return relevanceScore(experienceText, keywords) >
      relevanceScore(bestText, keywords)
      ? experience
      : best;
  }, undefined);
}

function bestBullets(
  experience: Experience,
  job: ParsedJob,
  limit = 2
): string[] {
  const keywords = jobKeywords(job);

  return experience.bullets
    .map((bullet, index) => ({
      bullet,
      index,
      score: relevanceScore(bullet, keywords),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ bullet }) => bullet)
    .filter(Boolean);
}

/** Pick the best bullet that contains a number (quantified achievement). */
function bestQuantifiedBullet(
  experience: Experience,
  job: ParsedJob
): string | undefined {
  const keywords = jobKeywords(job);

  return experience.bullets
    .filter((b) => /\d/.test(b))
    .map((bullet, index) => ({
      bullet,
      index,
      score: relevanceScore(bullet, keywords),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ bullet }) => bullet)[0];
}

function joinTerms(terms: string[], language: CvLanguage): string {
  if (terms.length <= 1) return terms[0] ?? "";

  const conjunction = language === "danish" ? "og" : "and";
  return `${terms.slice(0, -1).join(", ")} ${conjunction} ${terms.at(-1)}`;
}

function responsibilityScore(responsibility: string, cv: MasterCV): number {
  const verifiedTokens = new Set(normalize(
    [
      ...cv.skills,
      ...cv.tools,
      ...Object.values(cv.professionalSummary),
      ...cv.experience.flatMap((entry) => [entry.title, ...entry.bullets]),
    ].join(" ")
  ).split(" "));

  return Array.from(new Set(normalize(responsibility).split(" ")))
    .filter((term) => term.length >= 3)
    .reduce(
      (score, term) => score + (verifiedTokens.has(term) ? 1 : 0),
      0
    );
}

function selectResponsibility(cv: MasterCV, job: ParsedJob): string | undefined {
  return job.responsibilities
    .map((responsibility, index) => ({
      responsibility: responsibility.trim(),
      index,
      score: responsibilityScore(responsibility, cv),
    }))
    .filter(({ responsibility }) => responsibility.length > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.responsibility;
}

function verifiedResponsibilityTerms(
  cv: MasterCV,
  responsibility: string
): string[] {
  const normalizedResponsibility = normalize(responsibility);
  const seen = new Set<string>();

  return [...cv.skills, ...cv.tools]
    .filter((term) => {
      const normalized = normalize(term);
      if (
        !normalized ||
        seen.has(normalized) ||
        !termAppearsInText(term, normalizedResponsibility)
      ) {
        return false;
      }
      seen.add(normalized);
      return true;
    })
    .slice(0, 3);
}

export function buildCoverLetterMotivation(
  cv: MasterCV,
  job: ParsedJob,
  language: CvLanguage
): string {
  const company = displayValue(
    job.company,
    language === "danish" ? "jeres organisation" : "your organization"
  );
  const title = displayValue(job.title, "");
  const motivation = asMotivationClause(
    cv.professionalSummary.professionalMotivation,
    language
  );
  const responsibility = selectResponsibility(cv, job);

  if (language === "danish") {
    const opening = title
      ? `Stillingen som ${title} hos ${company} fangede min opmærksomhed.`
      : `Den ledige stilling hos ${company} fangede min opmærksomhed.`;
    const positionMotivation = `Stillingen motiverer mig særligt, fordi ${motivation}.`;
    if (!responsibility) {
      return `${opening} ${positionMotivation} De konkrete daglige opgaver er ikke beskrevet i opslaget, og muligheden for at høre mere om dem er en del af min interesse.`;
    }

    const terms = verifiedResponsibilityTerms(cv, responsibility);
    const connection = terms.length
      ? `den hænger sammen med min verificerede erfaring med ${joinTerms(terms, language)}`
      : "den hænger sammen med min verificerede faglige motivation";
    return `${opening} ${positionMotivation} Blandt de beskrevne opgaver motiverer “${responsibility}” mig særligt, fordi ${connection}.`;
  }

  const opening = title
    ? `The ${title} position at ${company} caught my attention.`
    : `The open position at ${company} caught my attention.`;
  const positionMotivation = `This position appeals to me because ${motivation}.`;
  if (!responsibility) {
    return `${opening} ${positionMotivation} The posting does not detail the day-to-day tasks, and learning more about them is part of my interest.`;
  }

  const terms = verifiedResponsibilityTerms(cv, responsibility);
  const connection = terms.length
    ? `it connects with my verified experience in ${joinTerms(terms, language)}`
    : "it connects with my verified professional motivation";
  return `${opening} ${positionMotivation} Among the listed tasks, “${responsibility}” is particularly motivating because ${connection}.`;
}

function roleEvidence(
  experience: Experience | undefined,
  job: ParsedJob,
  language: CvLanguage
): string {
  if (!experience) {
    return language === "danish"
      ? "Min faglige baggrund er beskrevet i det vedlagte CV."
      : "My professional background is outlined in the attached CV.";
  }

  const bullets = bestBullets(experience, job);
  const first = bullets[0]
    ? asFirstPersonClause(bullets[0], language)
    : "";
  const second = bullets[1]
    ? asFirstPersonClause(bullets[1], language)
    : "";

  if (language === "danish") {
    const opening = `Hos ${experience.company} var min rolle ${experience.title}`;
    if (!first) return `${opening}.`;

    return `${opening}. Jeg ${first}.${second ? ` Jeg ${second}.` : ""}`;
  }

  const opening = `At ${experience.company}, my role was ${experience.title}`;
  if (!first) return `${opening}.`;

  return `${opening}. I ${first}.${second ? ` I also ${second}.` : ""}`;
}

function quantifiedEvidenceSuffix(
  evidence: string,
  quantifiedBullet: string | undefined,
  language: CvLanguage
): string {
  if (!quantifiedBullet) return "";

  const clause = asFirstPersonClause(quantifiedBullet, language);
  if (normalize(evidence).includes(normalize(clause))) return "";

  return language === "danish"
    ? ` Konkret ${clause}.`
    : ` Specifically, I ${clause}.`;
}

function uniqueValueParagraph(
  cv: MasterCV,
  job: ParsedJob,
  relevantRole: Experience | undefined,
  language: CvLanguage
): string {
  // Look for transferable skills from gap analysis
  const missingTerms = [...job.skills, ...job.tools]
    .filter((term) => {
      const target = normalize(
        [...cv.skills, ...cv.tools].join(" ")
      );
      return !target.includes(normalize(term));
    })
    .slice(0, 3);

  const gaps = buildGapSuggestions(missingTerms, cv);
  const transferable = gaps.filter((g) => g.status === "transferable");

  // Cross-domain experience: if user has both frontend and backend, or tech and business
  const hasVerifiedTerm = (terms: string[]) =>
    [...cv.skills, ...cv.tools].some((skill) =>
      terms.some((term) => termsAreEquivalent(skill, term))
    );
  const hasFullStack =
    hasVerifiedTerm(["React", "Next.js", "CSS", "Frontend"]) &&
    hasVerifiedTerm(["Java", "Spring Boot", "SQL", "Backend", "REST API"]);

  if (language === "danish") {
    if (transferable.length > 0) {
      const t = transferable[0];
      return `Ud over mine kernekompetencer har jeg erfaring med ${t.relatedVerified?.slice(0, 2).join(" og ") ?? "relaterede teknologier"}, som giver et solidt fundament for hurtigt at lære nye værktøjer. ${hasFullStack ? "Min erfaring på tværs af frontend og backend styrker samarbejdet med både designere og driftsteams." : ""}`;
    }
    if (hasFullStack) {
      return "Min tværgående erfaring med både frontend og backend giver mig et helhedsperspektiv, der styrker samarbejdet med hele teamet — fra UX-design til drift.";
    }
    return relevantRole
      ? `Den erfaring, jeg har opbygget som ${relevantRole.title} hos ${relevantRole.company}, giver mig et unikt perspektiv, som jeg vil bringe med ind i rollen.`
      : "Min kombination af teknisk baggrund og forretningsforståelse giver mig et unikt perspektiv på denne rolle.";
  }

  if (transferable.length > 0) {
    const t = transferable[0];
    return `Beyond my core skills, my experience with ${t.relatedVerified?.slice(0, 2).join(" and ") ?? "related technologies"} provides a solid foundation for learning new tools quickly. ${hasFullStack ? "Working across the full stack strengthens my collaboration with design and operations teams." : ""}`;
  }
  if (hasFullStack) {
    return "Working across both frontend and backend gives me a holistic perspective that strengthens collaboration with the entire team — from UX design to operations.";
  }
  return relevantRole
    ? `The experience I built as ${relevantRole.title} at ${relevantRole.company} gives me a unique perspective that I would bring to this role.`
    : "My combination of technical background and business understanding gives me a unique perspective on this role.";
}

export function generateCoverLetter(
  cv: MasterCV,
  job: ParsedJob,
  language: CvLanguage = "english"
): GeneratedCoverLetter {
  const relevantRole = bestExperience(cv, job);
  const quantifiedBullet = relevantRole
    ? bestQuantifiedBullet(relevantRole, job)
    : undefined;

  if (language === "danish") {
    const company = displayValue(job.company, "jeres organisation");
    const companyReference =
      company === "jeres organisation" ? "jeres team" : `${company}-teamet`;
    const evidence = roleEvidence(relevantRole, job, language);
    const paragraphs = [
      buildCoverLetterMotivation(cv, job, language),
      evidence +
        quantifiedEvidenceSuffix(evidence, quantifiedBullet, language) +
        ` ${uniqueValueParagraph(cv, job, relevantRole, language)}`,
      `Jeg vil sætte pris på muligheden for at høre mere om ${companyReference}s behov i rollen og fortælle, hvordan jeg kan bidrage. Jeg er tilgængelig for en samtale, når det passer jer.`,
    ];

    return {
      greeting:
        company === "jeres organisation"
          ? "Kære rekrutteringsteam,"
          : `Kære ${company}-team,`,
      paragraphs,
      closing: "Med venlig hilsen,",
      signature: cv.personalInfo.fullName,
    };
  }

  const company = displayValue(job.company, "your organization");
  const companyReference =
    company === "your organization" ? "your team" : company;
  const evidence = roleEvidence(relevantRole, job, language);
  const paragraphs = [
    buildCoverLetterMotivation(cv, job, language),
    evidence +
      quantifiedEvidenceSuffix(evidence, quantifiedBullet, language) +
      ` ${uniqueValueParagraph(cv, job, relevantRole, language)}`,
    `I would welcome the opportunity to discuss how my experience can contribute to ${companyReference}. I am available for a conversation at your convenience. Thank you for considering my application.`,
  ];

  return {
    greeting:
      company === "your organization"
        ? "Dear Hiring Team,"
        : `Dear ${company} team,`,
    paragraphs,
    closing: "Sincerely,",
    signature: cv.personalInfo.fullName,
  };
}
