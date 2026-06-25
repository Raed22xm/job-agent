/**
 * CV Audit — scores each CV section and returns ranked improvements.
 * Uses only verified master-cv.json facts. Never invents skills.
 */
import type { MasterCV } from "@/types";

export interface SectionScore {
  section: string;
  score: number; // 0-100
  label: "Strong" | "Good" | "Needs Work" | "Weak";
  issues: string[];
  tips: string[];
  rewrittenExample?: string;
}

export interface CVAuditResult {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  sections: SectionScore[];
  topPriorities: string[];
  atsRisk: "Low" | "Medium" | "High";
  wordCount: number;
}

export function buildCVAuditPrompt(cv: MasterCV): string {
  const cvJson = JSON.stringify(cv, null, 2);

  return `You are a professional CV auditor and career coach. Audit the following master CV and return a structured JSON audit result.

RULES:
- Only reference facts that exist in the CV — never invent experience, skills, or metrics
- Be honest and specific — vague feedback is useless
- Provide concrete before/after rewrites for weak bullets
- Flag ATS risks (tables, graphics, unusual headers — assume plain text here)
- Score each section 0–100 based on: clarity, impact, ATS-friendliness, and specificity

Return a JSON object matching this exact structure:
{
  "overallScore": <number 0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "sections": [
    {
      "section": <string>,
      "score": <number 0-100>,
      "label": <"Strong"|"Good"|"Needs Work"|"Weak">,
      "issues": [<string>, ...],
      "tips": [<string>, ...],
      "rewrittenExample": <string or null>
    }
  ],
  "topPriorities": [<string>, ...],
  "atsRisk": <"Low"|"Medium"|"High">,
  "wordCount": <number>
}

Audit these sections: summary, experience (bullet quality), skills (relevance ordering), education, certifications/projects (if present).

Master CV to audit:
${cvJson}`;
}

export function scoreLabel(score: number): SectionScore["label"] {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Weak";
}

export function gradeFromScore(score: number): CVAuditResult["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function fallbackAudit(cv: MasterCV): CVAuditResult {
  const sections: SectionScore[] = [];

  // Summary
  const summaryLen = cv.personalInfo.summary?.length ?? 0;
  const summaryScore = summaryLen > 200 ? 75 : summaryLen > 80 ? 55 : 30;
  sections.push({
    section: "Professional Summary",
    score: summaryScore,
    label: scoreLabel(summaryScore),
    issues:
      summaryLen < 80
        ? ["Summary is too short — aim for 3–4 impactful sentences"]
        : [],
    tips: [
      "Open with your job title and years of experience",
      "Include 2–3 core skills that match your target role",
      "Add one quantifiable achievement",
    ],
  });

  // Experience bullets
  const allBullets = cv.experience.flatMap((e) => e.bullets);
  const bulletsWithNumbers = allBullets.filter((b) => /\d/.test(b));
  const bulletScore = Math.min(
    100,
    Math.round((bulletsWithNumbers.length / Math.max(allBullets.length, 1)) * 100)
  );
  sections.push({
    section: "Experience Bullets",
    score: bulletScore,
    label: scoreLabel(bulletScore),
    issues:
      bulletScore < 50
        ? [
            `Only ${bulletsWithNumbers.length}/${allBullets.length} bullets contain numbers — weak impact`,
          ]
        : [],
    tips: [
      "Lead every bullet with a strong action verb (Led, Built, Grew, Reduced)",
      "Add a measurable result to every bullet: % change, € amount, time saved",
      'Use the formula: Action + What + Result (e.g. "Reduced load time 40% by implementing caching")',
    ],
    rewrittenExample:
      allBullets[0]
        ? `Weak: "${allBullets[0]}"\nStrong: "Led ${allBullets[0].toLowerCase().replace(/^(managed|handled|responsible for)/i, "").trim()}, delivering X% improvement in [metric]"`
        : undefined,
  });

  // Skills
  const skillCount = cv.skills.length + cv.tools.length;
  const skillScore = skillCount > 15 ? 80 : skillCount > 8 ? 65 : 45;
  sections.push({
    section: "Skills & Tools",
    score: skillScore,
    label: scoreLabel(skillScore),
    issues: skillCount < 8 ? ["Too few skills listed — expand with all verified tools"] : [],
    tips: [
      "Group skills by category: Languages, Frameworks, Cloud, Soft Skills",
      "List most in-demand skills first for the roles you target",
      "Remove vague entries like 'Microsoft Office' unless directly relevant",
    ],
  });

  // Education
  const eduScore = cv.education.length > 0 ? 75 : 30;
  sections.push({
    section: "Education",
    score: eduScore,
    label: scoreLabel(eduScore),
    issues: cv.education.length === 0 ? ["No education entries found"] : [],
    tips: [
      "If you have relevant coursework or thesis, add it under the degree",
      "For senior roles, move education below experience",
    ],
  });

  const overall = Math.round(
    sections.reduce((sum, s) => sum + s.score, 0) / sections.length
  );

  return {
    overallScore: overall,
    grade: gradeFromScore(overall),
    sections,
    topPriorities: sections
      .filter((s) => s.score < 70)
      .sort((a, b) => a.score - b.score)
      .map((s) => `Improve ${s.section}: ${s.tips[0]}`),
    atsRisk: overall > 70 ? "Low" : overall > 50 ? "Medium" : "High",
    wordCount: allBullets.join(" ").split(/\s+/).length,
  };
}
