import type { CvLanguage } from "@/lib/cvLanguage";
import {
  termAppearsInText,
} from "@/lib/jobDictionaries";
import type {
  Experience,
  GeneratedCoverLetter,
  MasterCV,
  ParsedJob,
} from "@/types";

export const MAX_COVER_LETTER_WORDS = 400;

function boundedSourceText(value: string, maxWords: number): string {
  const words = value.trim().replace(/^[-•]\s*/u, "").split(/\s+/u).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${stripFinalPunctuation(words.slice(0, maxWords).join(" "))}…`;
}

export function coverLetterWordCount(letter: GeneratedCoverLetter): number {
  return [letter.headline, letter.greeting, ...letter.paragraphs, letter.closing, letter.signature]
    .join(" ").trim().split(/\s+/u).filter(Boolean).length;
}

/**
 * Heuristic cover letter from verified CV facts. AI-enhanced version via POST /api/analyze-job?enhanceWithAI.
 */
function displayValue(value: string, fallback: string): string {
  const trimmed = value.trim();
  return !trimmed ||
    trimmed === "Not detected" ||
    trimmed === "Role title not detected"
    ? fallback
    : boundedSourceText(trimmed, 8);
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
  const trimmed = stripFinalPunctuation(boundedSourceText(value, 25));
  if (language === "english" && /^I\b/u.test(trimmed)) return trimmed;
  return lowercaseFirstWord(trimmed);
}

function asFirstPersonClause(value: string, language: CvLanguage): string {
  const trimmed = stripFinalPunctuation(boundedSourceText(value, 25));
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
  terms = terms.map((term) => boundedSourceText(term, 4));
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
  const selectedResponsibility = selectResponsibility(cv, job);
  const responsibility = selectedResponsibility
    ? boundedSourceText(selectedResponsibility, 24)
    : undefined;

  if (language === "danish") {
    const opening = title
      ? `Stillingen som ${title} hos ${company} fangede min opmærksomhed.`
      : `Den ledige stilling hos ${company} fangede min opmærksomhed.`;
    const positionMotivation = `Stillingen motiverer mig særligt, fordi ${motivation}.`;
    if (!responsibility) {
      return `${opening} ${positionMotivation} De konkrete daglige opgaver er ikke beskrevet i opslaget, og muligheden for at høre mere om dem er en del af min interesse. Opslaget giver ikke tilstrækkelige oplysninger til yderligere udsagn om arbejdspladsen.`;
    }

    const terms = verifiedResponsibilityTerms(cv, selectedResponsibility!);
    const connection = terms.length
      ? `den hænger sammen med min verificerede erfaring med ${joinTerms(terms, language)}`
      : "den hænger sammen med min verificerede faglige motivation";
    const employerMotivation =
      company === "jeres organisation"
        ? "Opslaget giver ikke tilstrækkelige oplysninger til yderligere udsagn om arbejdspladsen."
        : `Min motivation for ${company} som arbejdsplads bygger på den konkrete opgave, der er beskrevet i opslaget.`;
    return `${opening} ${positionMotivation} Blandt de beskrevne opgaver motiverer “${responsibility}” mig særligt, fordi ${connection}. ${employerMotivation}`;
  }

  const opening = title
    ? `The ${title} position at ${company} caught my attention.`
    : `The open position at ${company} caught my attention.`;
  const positionMotivation = `This position appeals to me because ${motivation}.`;
  if (!responsibility) {
    return `${opening} ${positionMotivation} The posting does not detail the day-to-day tasks, and learning more about them is part of my interest. The posting does not provide enough detail to make further claims about the workplace.`;
  }

  const terms = verifiedResponsibilityTerms(cv, selectedResponsibility!);
  const connection = terms.length
    ? `it connects with my verified experience in ${joinTerms(terms, language)}`
    : "it connects with my verified professional motivation";
  const employerMotivation =
    company === "your organization"
      ? "The posting does not provide enough detail to make further claims about the workplace."
      : `My motivation for ${company} as a workplace is based on that concrete responsibility described in the posting.`;
  return `${opening} ${positionMotivation} Among the listed tasks, “${responsibility}” is particularly motivating because ${connection}. ${employerMotivation}`;
}

function verifiedJobTerms(cv: MasterCV, job: ParsedJob, limit = 3): string[] {
  const parsedJobText = [
    job.title,
    ...job.responsibilities,
    ...job.requirements,
    ...job.skills,
    ...job.tools,
    ...job.atsKeywords,
  ].join(" ");
  const seen = new Set<string>();
  return [...cv.skills, ...cv.tools]
    .filter((term) => {
      const key = normalize(term);
      if (!key || seen.has(key) || !termAppearsInText(term, parsedJobText)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function buildCoverLetterHeadline(
  cv: MasterCV,
  job: ParsedJob,
  language: CvLanguage
): string {
  const company = displayValue(
    job.company,
    language === "danish" ? "jeres organisation" : "your organization"
  );
  const title = displayValue(
    job.title,
    language === "danish" ? "den ledige rolle" : "the open role"
  );
  const terms = verifiedJobTerms(cv, job, 2);
  const focus = terms.length
    ? joinTerms(terms, language)
    : bestExperience(cv, job)?.title;

  if (focus) {
    return language === "danish"
      ? `${focus} til stillingen som ${title} hos ${company}`
      : `${focus} for the ${title} role at ${company}`;
  }
  return language === "danish"
    ? `Ansøgning — ${title} hos ${company}`
    : `Application — ${title} at ${company}`;
}

function primaryContribution(
  experience: Experience | undefined,
  job: ParsedJob,
  language: CvLanguage
): string {
  if (!experience) {
    return language === "danish"
      ? "Min verificerede faglige baggrund fremgår af det vedlagte CV."
      : "My verified professional background is documented in the attached CV.";
  }
  const details = [bestQuantifiedBullet(experience, job) ?? bestBullets(experience, job, 1)[0]]
    .filter((value): value is string => Boolean(value));
  const opening = language === "danish"
    ? `Hos ${boundedSourceText(experience.company, 8)} var min rolle ${boundedSourceText(experience.title, 8)}.`
    : `At ${boundedSourceText(experience.company, 8)}, my role was ${boundedSourceText(experience.title, 8)}.`;
  const evidence = details.map((item, index) => {
    const clause = asFirstPersonClause(item, language);
    if (language === "danish") return `${index ? "Derudover" : "Jeg"} ${clause}.`;
    return `${index ? "I also" : "I"} ${clause}.`;
  });
  return [opening, ...evidence].join(" ");
}

function secondaryContribution(
  cv: MasterCV,
  job: ParsedJob,
  primaryRole: Experience | undefined,
  language: CvLanguage
): string {
  const keywords = jobKeywords(job);
  const project = (cv.projects ?? [])
    .map((item, index) => ({
      item,
      index,
      score: relevanceScore(`${item.name} ${item.description}`, keywords),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.item;
  if (project) {
    const name = boundedSourceText(project.name, 8);
    const description = stripFinalPunctuation(boundedSourceText(project.description, 25));
    return language === "danish"
      ? `Som et yderligere verificeret bidrag har jeg gennemført projektet ${name}. Mit verificerede CV beskriver projektet sådan: “${description}”.`
      : `As a further verified contribution, I completed the ${name} project. My verified CV describes the project as follows: “${description}”.`;
  }

  const secondRole = cv.experience
    .filter((entry) => entry.id !== primaryRole?.id)
    .map((item, index) => ({
      item,
      index,
      score: relevanceScore(`${item.title} ${item.bullets.join(" ")}`, keywords),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.item;
  if (secondRole) {
    const bullet = bestBullets(secondRole, job, 1)[0];
    const clause = bullet ? asFirstPersonClause(bullet, language) : "";
    const detail = clause
      ? language === "danish" ? ` Jeg ${clause}.` : ` I ${clause}.`
      : "";
    const title = boundedSourceText(secondRole.title, 8);
    const company = boundedSourceText(secondRole.company, 8);
    return language === "danish"
      ? `Min erfaring som ${title} hos ${company} er et særskilt bidrag.${detail}`
      : `My experience as ${title} at ${company} is a distinct contribution.${detail}`;
  }

  const terms = verifiedJobTerms(cv, job);
  const verified = terms.length ? terms : [...cv.skills, ...cv.tools].slice(0, 3);
  return language === "danish"
    ? `Et yderligere verificeret bidrag er mine kompetencer inden for ${joinTerms(verified, language)}.`
    : `A further verified contribution is my experience with ${joinTerms(verified, language)}.`;
}

function colleagueContribution(cv: MasterCV, language: CvLanguage): string {
  const strengths = asMotivationClause(
    cv.professionalSummary.personalStrengths,
    language
  );
  return language === "danish"
    ? `Som kollega bidrager jeg med det, der er dokumenteret i mit CV: ${strengths}.`
    : `As a colleague, I contribute what is documented in my CV: ${strengths}.`;
}

function interviewClosing(job: ParsedJob, language: CvLanguage): string {
  const company = displayValue(
    job.company,
    language === "danish" ? "jeres organisation" : "your organization"
  );
  const title = displayValue(
    job.title,
    language === "danish" ? "den ledige rolle" : "the open role"
  );
  return language === "danish"
    ? `Jeg vil sætte pris på en samtale om, hvordan min verificerede erfaring kan bidrage i stillingen som ${title} hos ${company}.`
    : `I would welcome an interview to discuss how my verified experience can contribute in the ${title} role at ${company}.`;
}

export function generateCoverLetter(
  cv: MasterCV,
  job: ParsedJob,
  language: CvLanguage = "english"
): GeneratedCoverLetter {
  const relevantRole = bestExperience(cv, job);
  const headline = buildCoverLetterHeadline(cv, job, language);
  const paragraphs = [
    buildCoverLetterMotivation(cv, job, language),
    primaryContribution(relevantRole, job, language),
    secondaryContribution(cv, job, relevantRole, language),
    colleagueContribution(cv, language),
    interviewClosing(job, language),
  ];

  if (language === "danish") {
    const company = displayValue(job.company, "jeres organisation");
    return {
      headline,
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
  return {
    headline,
    greeting:
      company === "your organization"
        ? "Dear Hiring Team,"
        : `Dear ${company} team,`,
    paragraphs,
    closing: "Sincerely,",
    signature: cv.personalInfo.fullName,
  };
}
