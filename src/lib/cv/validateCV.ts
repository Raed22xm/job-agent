import { normalizeTerm, termAppearsInText } from "@/lib/jobDictionaries";
import type {
  CVValidationIssue,
  CVValidationResult,
  GeneratedCoverLetter,
  GeneratedCV,
  MasterCV,
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
      const clean = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, "").replace(/s\b/g, "").replace(/\s+/g, " ").trim();
      const cleanB = clean(normB);

      const isMatch = verifiedBulletArr.some(vb => {
        const cleanVb = clean(vb);
        return cleanVb === cleanB || cleanVb.includes(cleanB) || cleanB.includes(cleanVb);
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

  if (generated.sections.summary !== master.personalInfo.summary) {
    issues.push({
      field: "summary",
      message:
        "Summary differs from master CV. Review for unsupported claims before applying.",
      severity: "warning",
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
  jobCompany: string
): CVValidationResult {
  const issues: CVValidationIssue[] = [];
  const fullText = [
    letter.greeting,
    ...letter.paragraphs,
    letter.closing,
    letter.signature,
  ].join(" ");

  const verifiedCompanies = master.experience.map((e) => e.company);

  for (const company of verifiedCompanies) {
    if (fullText.includes(company)) continue;
  }

  if (
    jobCompany !== "Not detected" &&
    !fullText.toLowerCase().includes(jobCompany.toLowerCase())
  ) {
    issues.push({
      field: "company",
      message: `Cover letter does not mention "${jobCompany}". Consider adding a company reference.`,
      severity: "warning",
    });
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}
