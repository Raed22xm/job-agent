import type { CvLanguage } from "@/lib/cvLanguage";
import { buildGapSuggestions } from "@/lib/gapSuggestions";
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
  const hasFullStack =
    cv.skills.some((s) => /react|next|css|front/i.test(s)) &&
    cv.skills.some((s) => /java|spring|sql|backend|api/i.test(s));

  if (language === "danish") {
    if (transferable.length > 0) {
      const t = transferable[0];
      return `Ud over mine kernekompetencer har jeg erfaring med ${t.relatedVerified?.slice(0, 2).join(" og ") ?? "relaterede teknologier"}, som giver et solidt fundament for hurtigt at arbejde med ${t.missing}. ${hasFullStack ? "Min erfaring på tværs af frontend og backend giver mig et helhedsperspektiv, der styrker samarbejdet med både designere og driftsteams." : ""}`;
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
    return `Beyond my core skills, my experience with ${t.relatedVerified?.slice(0, 2).join(" and ") ?? "related technologies"} provides a solid foundation for working with ${t.missing}. ${hasFullStack ? "Working across the full stack gives me a holistic perspective that strengthens collaboration with both design and operations teams." : ""}`;
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
  const relevantTerms = matchedCvTerms(cv, job).slice(0, 4);
  const jobFocus = job.responsibilities.find((item) => item.trim().length > 0);
  const quantifiedBullet = relevantRole
    ? bestQuantifiedBullet(relevantRole, job)
    : undefined;

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
      roleEvidence(relevantRole, job, language) +
        (quantifiedBullet
          ? ` Konkret ${asFirstPersonClause(quantifiedBullet, language)}.`
          : ""),
      uniqueValueParagraph(cv, job, relevantRole, language),
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
    roleEvidence(relevantRole, job, language) +
      (quantifiedBullet
        ? ` Specifically, I ${asFirstPersonClause(quantifiedBullet, language)}.`
        : ""),
    uniqueValueParagraph(cv, job, relevantRole, language),
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
