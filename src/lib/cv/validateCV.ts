import {
  KNOWN_SKILLS,
  KNOWN_TOOLS,
  normalizeTerm,
  termAppearsInText,
  termsAreEquivalent,
} from "@/lib/jobDictionaries";
import { buildProfessionalSummary } from "@/lib/generateCV";
import {
  coverLetterWordCount,
  generateCoverLetter,
  MAX_COVER_LETTER_WORDS,
} from "@/lib/generateCoverLetter";
import type { CvLanguage } from "@/lib/cvLanguage";
import type {
  CVValidationIssue,
  CVValidationResult,
  GeneratedCoverLetter,
  GeneratedCV,
  MasterCV,
  ParsedJob,
} from "@/types";

function masterSkillSet(cv: MasterCV): Set<string> {
  return new Set(
    [...cv.skills, ...cv.tools].map((s) => normalizeTerm(s)).filter(Boolean)
  );
}

function masterExperienceIds(cv: MasterCV): Set<string> {
  return new Set(cv.experience.map((e) => e.id));
}

function masterEducationIds(cv: MasterCV): Set<string> {
  return new Set(cv.education.map((e) => e.id));
}

function masterCompanies(cv: MasterCV): Set<string> {
  return new Set(cv.experience.map((e) => normalizeTerm(e.company)));
}

function masterExperienceBullets(cv: MasterCV): Map<string, Set<string>> {
  return new Map(
    cv.experience.map((entry) => [
      entry.id,
      new Set(entry.bullets.map((bullet) => normalizeTerm(bullet))),
    ])
  );
}

/**
 * Validates generated CV content against verified master CV data.
 * Flags invented skills, unknown experience entries, or unsupported claims.
 */
export function validateGeneratedCV(
  generated: GeneratedCV,
  master: MasterCV
): CVValidationResult {
  const issues: CVValidationIssue[] = [];
  const verifiedSkills = masterSkillSet(master);
  const verifiedExpIds = masterExperienceIds(master);
  const verifiedEduIds = masterEducationIds(master);
  const verifiedCompanies = masterCompanies(master);
  const verifiedBulletsByExperience = masterExperienceBullets(master);
  const summaryElements = master.professionalSummary;

  for (const [field, value] of Object.entries(summaryElements)) {
    if (!value.trim()) {
      issues.push({
        field: `professionalSummary.${field}`,
        message: `Verified professional summary element "${field}" is empty. Complete the master CV before exporting.`,
        severity: "error",
      });
    }
  }

  for (const skill of generated.sections.skills) {
    const norm = normalizeTerm(skill);
    const found = [...verifiedSkills].some(
      (v) => v === norm || termAppearsInText(skill, v) || termAppearsInText(v, skill)
    );
    if (!found) {
      issues.push({
        field: `skills.${skill}`,
        message: `"${skill}" is not verified in master CV — remove or verify before applying.`,
        severity: "error",
      });
    }
  }

  for (const exp of generated.sections.experience) {
    if (!verifiedExpIds.has(exp.id)) {
      issues.push({
        field: `experience.${exp.id}`,
        message: `Experience entry "${exp.title}" at "${exp.company}" is not in master CV.`,
        severity: "error",
      });
    } else if (!verifiedCompanies.has(normalizeTerm(exp.company))) {
      issues.push({
        field: `experience.${exp.id}.company`,
        message: `Company "${exp.company}" does not match master CV records.`,
        severity: "warning",
      });
    }

    const verifiedBullets = verifiedBulletsByExperience.get(exp.id);
    if (!verifiedBullets) continue;

    const verifiedBulletArr = Array.from(verifiedBullets);
    
    for (const bullet of exp.bullets) {
      const normB = normalizeTerm(bullet);
      
      // Clean function to handle minor AI tweaks: remove punctuation, normalize spaces
      const clean = (s: string) =>
        s
          .toLowerCase()
          .replace(/over\s+(\d+)/g, "$1+")
          .replace(/more\s+than\s+(\d+)/g, "$1+")
          .replace(/(\d+)\s*\+/g, "$1")
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, " ")
          .trim();
          
      const cleanB = clean(normB);

      const getTokens = (s: string) =>
        new Set(clean(s).split(/\s+/).filter((w) => w.length > 2));
      const tokensB = getTokens(bullet);

      const isMatch = verifiedBulletArr.some((vb) => {
        const cleanVb = clean(vb);
        if (
          cleanVb === cleanB ||
          cleanVb.includes(cleanB) ||
          cleanB.includes(cleanVb)
        ) {
          return true;
        }

        const tokensVb = getTokens(vb);
        if (tokensB.size === 0 || tokensVb.size === 0) return false;
        let common = 0;
        tokensB.forEach((t) => {
          if (tokensVb.has(t)) common++;
        });
        const overlapRatio = common / Math.min(tokensB.size, tokensVb.size);
        return overlapRatio >= 0.4;
      });

      if (!isMatch) {
        const snippet = bullet.length > 60 ? bullet.slice(0, 57) + "…" : bullet;
        issues.push({
          field: `experience.${exp.id}.bullets`,
          message:
            `Bullet "${snippet}" under "${exp.title}" does not closely match a verified master CV bullet. Remove it or add it to the master CV first.`,
          severity: "error",
        });
      }
    }
  }

  for (const edu of generated.sections.education) {
    if (!verifiedEduIds.has(edu.id)) {
      issues.push({
        field: `education.${edu.id}`,
        message: `Education entry "${edu.degree}" is not in master CV.`,
        severity: "error",
      });
    }
  }

  if (generated.sections.summary !== buildProfessionalSummary(master)) {
    issues.push({
      field: "summary",
      message:
        "Professional summary must preserve all four verified elements in their canonical order.",
      severity: "error",
    });
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}

/**
 * Basic check that cover letter references only known companies from master CV.
 */
export function validateCoverLetter(
  letter: GeneratedCoverLetter,
  master: MasterCV,
  job: ParsedJob,
  language: CvLanguage
): CVValidationResult {
  const issues: CVValidationIssue[] = [];
  const fullText = [
    letter.greeting,
    ...letter.paragraphs,
    letter.closing,
    letter.signature,
  ].join(" ");

  const canonicalLetter = generateCoverLetter(master, job, language);

  if (coverLetterWordCount(letter) > MAX_COVER_LETTER_WORDS) {
    issues.push({
      field: "wordCount",
      message: `Cover letter must contain no more than ${MAX_COVER_LETTER_WORDS} words in total.`,
      severity: "error",
    });
  }

  if (!letter.headline.trim() || letter.headline !== canonicalLetter.headline) {
    issues.push({
      field: "headline",
      message: "Headline must preserve the verified job and CV overlap.",
      severity: "error",
    });
  }

  if (letter.paragraphs.length !== 5) {
    issues.push({
      field: "paragraphs",
      message: "Cover letter must contain exactly five canonical AKA sections.",
      severity: "error",
    });
  }

  const paragraphFields = [
    "motivation",
    "valueContribution.1",
    "valueContribution.2",
    "colleagueContribution",
    "interviewClosing",
  ];
  for (const [index, field] of paragraphFields.entries()) {
    if (letter.paragraphs[index] !== canonicalLetter.paragraphs[index]) {
      issues.push({
        field,
        message: `Cover letter section ${index + 1} must preserve its verified canonical wording.`,
        severity: "error",
      });
    }
  }
  if (letter.greeting !== canonicalLetter.greeting) {
    issues.push({
      field: "greeting",
      message: "Greeting must preserve the canonical job-company wording.",
      severity: "error",
    });
  }
  if (letter.closing !== canonicalLetter.closing) {
    issues.push({
      field: "closing",
      message: "Sign-off must preserve the canonical localized wording.",
      severity: "error",
    });
  }
  if (letter.signature !== canonicalLetter.signature) {
    issues.push({
      field: "signature",
      message: "Signature must match the verified master CV identity.",
      severity: "error",
    });
  }

  // Only the contribution sections make evidence claims. The interview closing
  // intentionally repeats the parsed job title and company and must not be
  // mistaken for an unsupported CV skill or a former employer.
  const evidenceText = letter.paragraphs.slice(1, 4).join(" ");
  const verifiedTerms = [...master.skills, ...master.tools];
  const verifiedClaimText = [
    ...Object.values(master.professionalSummary),
    ...master.experience.flatMap((entry) => [
      entry.title,
      entry.company,
      ...entry.bullets,
    ]),
    ...(master.projects ?? []).flatMap((project) => [
      project.name,
      project.description,
    ]),
  ].join(" ");
  const claimCandidates = Array.from(
    new Set([...KNOWN_SKILLS, ...KNOWN_TOOLS, ...job.skills, ...job.tools, ...job.atsKeywords])
  );
  for (const term of claimCandidates) {
    const verified =
      verifiedTerms.some((candidate) => termsAreEquivalent(candidate, term)) ||
      termAppearsInText(term, verifiedClaimText);
    if (!verified && termAppearsInText(term, evidenceText)) {
      issues.push({
        field: "evidence.skill",
        message: `Cover letter evidence mentions unsupported skill or tool "${term}". Remove it or verify it in the master CV.`,
        severity: "error",
      });
    }
  }

  const verifiedCompanies = new Set(
    master.experience.map((entry) => normalizeTerm(entry.company))
  );
  const organizationPattern =
    /\b(?:At|at|Hos|hos)\s+([\p{Lu}][\p{L}\d&.-]*(?:\s+[\p{Lu}][\p{L}\d&.-]*){0,3})(?=\s*(?:,|\.|var\b|arbejdede\b))/gu;
  for (const match of evidenceText.matchAll(organizationPattern)) {
    const company = match[1];
    if (!verifiedCompanies.has(normalizeTerm(company))) {
      issues.push({
        field: "evidence.company",
        message: `Cover letter evidence mentions unverified employer "${company}".`,
        severity: "error",
      });
    }
  }

  if (
    job.company !== "Not detected" &&
    !fullText.toLowerCase().includes(job.company.toLowerCase())
  ) {
    issues.push({
      field: "company",
      message: `Cover letter does not mention "${job.company}". Consider adding a company reference.`,
      severity: "warning",
    });
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}
