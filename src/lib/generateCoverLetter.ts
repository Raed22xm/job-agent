import type { CvLanguage } from "@/lib/cvLanguage";
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

function matchedCvTerms(cv: MasterCV, job: ParsedJob): string[] {
  const target = jobText(job);
  const seen = new Set<string>();

  return [...cv.skills, ...cv.tools].filter((term) => {
    const normalized = normalize(term);
    if (!normalized || seen.has(normalized) || !target.includes(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
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

function joinTerms(terms: string[], language: CvLanguage): string {
  if (terms.length <= 1) return terms[0] ?? "";

  const conjunction = language === "danish" ? "og" : "and";
  return `${terms.slice(0, -1).join(", ")} ${conjunction} ${terms.at(-1)}`;
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

export function generateCoverLetter(
  cv: MasterCV,
  job: ParsedJob,
  language: CvLanguage = "english"
): GeneratedCoverLetter {
  const relevantRole = bestExperience(cv, job);
  const relevantTerms = matchedCvTerms(cv, job).slice(0, 4);
  const jobFocus = job.responsibilities.find((item) => item.trim().length > 0);

  if (language === "danish") {
    const company = displayValue(job.company, "jeres organisation");
    const title = displayValue(job.title, "den ledige stilling");
    const companyReference =
      company === "jeres organisation" ? "jeres team" : `${company}-teamet`;
    const roleOpening =
      company === "jeres organisation"
        ? `stillingen som ${title}`
        : `stillingen som ${title} hos ${company}`;
    const focusSentence = jobFocus
      ? `I opslaget om ${roleOpening} lagde jeg især mærke til dette ansvar: ${stripFinalPunctuation(jobFocus)}.`
      : `${roleOpening.charAt(0).toLocaleUpperCase() + roleOpening.slice(1)} fangede min interesse.`;
    const termsSentence = relevantTerms.length
      ? `Min baggrund omfatter ${joinTerms(relevantTerms, language)}, som også går igen i rollen.`
      : relevantRole
        ? `Rollen ligger tæt på det arbejde, jeg har udført som ${relevantRole.title}.`
        : "";

    const paragraphs = [
      [focusSentence, termsSentence].filter(Boolean).join(" "),
      roleEvidence(relevantRole, job, language),
      `Den erfaring vil jeg gerne bringe med ind i ${companyReference}. Jeg vil sætte pris på muligheden for at høre mere om jeres behov i rollen og fortælle, hvordan jeg kan bidrage.`,
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
  const title = displayValue(job.title, "the open role");
  const companyReference =
    company === "your organization" ? "your team" : company;
  const roleOpening =
    company === "your organization"
      ? title
      : `the ${title} role at ${company}`;
  const focusSentence = jobFocus
    ? `In the posting for ${roleOpening}, one responsibility stood out to me: ${stripFinalPunctuation(jobFocus)}.`
    : `${roleOpening.charAt(0).toLocaleUpperCase() + roleOpening.slice(1)} caught my attention.`;
  const termsSentence = relevantTerms.length
    ? `My background includes ${joinTerms(relevantTerms, language)}, which also feature in the role.`
    : relevantRole
      ? `The role connects with the work I have done as ${relevantRole.title}.`
      : "";

  const paragraphs = [
    [focusSentence, termsSentence].filter(Boolean).join(" "),
    roleEvidence(relevantRole, job, language),
    `I would value the opportunity to bring that experience to ${companyReference} and learn more about what your team needs from this role. Thank you for considering my application.`,
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
