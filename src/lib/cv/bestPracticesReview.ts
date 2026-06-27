import {
  bulletImpactScore,
  bulletQuality,
  hasWeakOpener,
  summaryQualityScore,
} from "@/lib/cv/cvFeedback";
import { scoreCVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";
import type { GeneratedCV, ParsedJob } from "@/types";

export type BestPracticeStatus = "pass" | "warn" | "fail";

export interface BestPracticeCheck {
  id: string;
  category: "content" | "ats" | "impact" | "structure";
  label: string;
  bestPractice: string;
  yourStatus: string;
  status: BestPracticeStatus;
  suggestion?: string;
}

export type SendReadiness = "ready" | "review" | "not-ready";

export interface BestPracticesReviewResult {
  overallScore: number;
  readiness: SendReadiness;
  headline: string;
  checks: BestPracticeCheck[];
  passCount: number;
  warnCount: number;
  failCount: number;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function summaryMentionsJob(cv: GeneratedCV, job: ParsedJob): boolean {
  const summary = normalizeForMatch(cv.sections.summary);
  const titleWords = normalizeForMatch(job.title)
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (titleWords.some((w) => summary.includes(w))) return true;

  const jobTerms = [...job.skills, ...job.tools, ...job.atsKeywords]
    .map((t) => normalizeForMatch(t))
    .filter((t) => t.length > 2);

  let hits = 0;
  for (const term of jobTerms) {
    if (summary.includes(term)) hits++;
    if (hits >= 2) return true;
  }
  return false;
}

function bulletMetricRate(cv: GeneratedCV): number {
  const bullets = cv.sections.experience.flatMap((r) => r.bullets).filter(Boolean);
  if (bullets.length === 0) return 0;
  return bullets.filter((b) => hasNumber(b)).length / bullets.length;
}

function weakBulletRate(cv: GeneratedCV): number {
  const bullets = cv.sections.experience.flatMap((r) => r.bullets).filter(Boolean);
  if (bullets.length === 0) return 1;
  return bullets.filter((b) => bulletQuality(b) === "weak").length / bullets.length;
}

function dutyLanguageCount(cv: GeneratedCV): number {
  return cv.sections.experience
    .flatMap((r) => r.bullets)
    .filter((b) => hasWeakOpener(b)).length;
}

function statusFromScore(
  score: number,
  passAt: number,
  warnAt: number
): BestPracticeStatus {
  if (score >= passAt) return "pass";
  if (score >= warnAt) return "warn";
  return "fail";
}

function readinessFromChecks(checks: BestPracticeCheck[]): SendReadiness {
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  if (failCount > 0) return "not-ready";
  if (warnCount >= 3) return "review";
  if (warnCount > 0) return "review";
  return "ready";
}

function headlineForReadiness(readiness: SendReadiness, score: number): string {
  switch (readiness) {
    case "ready":
      return `Strong fit against best practices (${score}/100) — good to export and apply.`;
    case "review":
      return `Mostly aligned (${score}/100) — review warnings before you send.`;
    case "not-ready":
      return `Gaps vs. best practices (${score}/100) — fix critical items before applying.`;
  }
}

/**
 * Compares a tailored CV against widely validated CV writing best practices
 * (ATS pass, recruiter scan, achievement bullets, tailoring).
 */
export function compareToBestPractices(
  cv: GeneratedCV,
  job: ParsedJob
): BestPracticesReviewResult {
  const checks: BestPracticeCheck[] = [];
  const { summary, skills, experience, header } = cv.sections;

  // ── Tailoring ─────────────────────────────────────────────────────────────
  const keywordCoverage = scoreCVKeywordCoverage(cv, job);
  const keywordStatus = statusFromScore(keywordCoverage.score, 70, 50);
  checks.push({
    id: "keyword-tailoring",
    category: "ats",
    label: "Job keyword alignment",
    bestPractice: "Mirror 70%+ of job keywords naturally (summary, skills, bullets).",
    yourStatus: `${keywordCoverage.score}% coverage (${keywordCoverage.matched.length}/${keywordCoverage.total} terms)`,
    status: keywordStatus,
    suggestion:
      keywordStatus !== "pass" && keywordCoverage.missing.length > 0
        ? `Weave missing terms where truthful: ${keywordCoverage.missing.slice(0, 4).join(", ")}`
        : undefined,
  });

  const tailoredSummary = summaryMentionsJob(cv, job);
  checks.push({
    id: "tailored-summary",
    category: "content",
    label: "Summary tailored to role",
    bestPractice: "Profile mentions the target role or key job requirements in the first lines.",
    yourStatus: tailoredSummary
      ? "Summary references this role or its requirements"
      : "Summary reads generic — no clear link to this job",
    status: tailoredSummary ? "pass" : "warn",
    suggestion: tailoredSummary
      ? undefined
      : `Open with "${job.title}" and 2–3 skills from the posting.`,
  });

  // ── Summary quality ─────────────────────────────────────────────────────────
  const summaryWords = wordCount(summary);
  const summaryLenStatus: BestPracticeStatus =
    summaryWords >= 40 && summaryWords <= 120
      ? "pass"
      : summaryWords > 0
        ? "warn"
        : "fail";
  checks.push({
    id: "summary-length",
    category: "content",
    label: "Summary length",
    bestPractice: "3–5 lines (40–120 words) — enough context for a 6-second scan.",
    yourStatus: summaryWords === 0 ? "Empty" : `${summaryWords} words`,
    status: summaryLenStatus,
    suggestion:
      summaryLenStatus !== "pass"
        ? "Trim or expand to 40–120 words focused on this role."
        : undefined,
  });

  const summaryHasMetric = hasNumber(summary);
  checks.push({
    id: "summary-metric",
    category: "impact",
    label: "Quantified summary",
    bestPractice: "Include one measurable win (%, time saved, team size, volume).",
    yourStatus: summaryHasMetric ? "Contains a number" : "No quantified achievement",
    status: summaryHasMetric ? "pass" : "warn",
    suggestion: summaryHasMetric
      ? undefined
      : "Add one defensible metric from your verified experience.",
  });

  const summaryScore = summaryQualityScore(cv);
  checks.push({
    id: "summary-quality",
    category: "impact",
    label: "Summary opener strength",
    bestPractice: "Lead with title + experience — avoid “I am…” or duty language.",
    yourStatus: `${summaryScore}/100 quality score`,
    status: statusFromScore(summaryScore, 70, 45),
    suggestion:
      summaryScore < 70
        ? "Start with your role, years of experience, and top skills for this job."
        : undefined,
  });

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skillCount = skills.length;
  const skillStatus: BestPracticeStatus =
    skillCount >= 8 && skillCount <= 15
      ? "pass"
      : skillCount >= 5
        ? "warn"
        : skillCount > 0
          ? "fail"
          : "fail";
  checks.push({
    id: "skills-count",
    category: "ats",
    label: "Skills section depth",
    bestPractice: "8–15 relevant hard skills ranked by job fit.",
    yourStatus: `${skillCount} skills listed`,
    status: skillStatus,
    suggestion:
      skillStatus !== "pass"
        ? "Add verified skills from your master CV that match the posting."
        : undefined,
  });

  // ── Experience bullets ──────────────────────────────────────────────────────
  const impactScore = bulletImpactScore(cv);
  checks.push({
    id: "bullet-impact",
    category: "impact",
    label: "Achievement-driven bullets",
    bestPractice: "Action verb + context + metric — duties alone rarely win interviews.",
    yourStatus: `${impactScore}/100 average bullet quality`,
    status: statusFromScore(impactScore, 65, 45),
    suggestion:
      impactScore < 65
        ? "Rewrite top bullets using: Accomplished [X] as measured by [Y] by doing [Z]."
        : undefined,
  });

  const metricRate = Math.round(bulletMetricRate(cv) * 100);
  checks.push({
    id: "bullet-metrics",
    category: "impact",
    label: "Metrics in experience",
    bestPractice: "At least 40% of bullets include a number; aim higher for senior roles.",
    yourStatus: `${metricRate}% of bullets quantified`,
    status: statusFromScore(metricRate, 40, 20),
    suggestion:
      metricRate < 40
        ? "Add scope, frequency, or before/after numbers you can defend in an interview."
        : undefined,
  });

  const weakRate = Math.round(weakBulletRate(cv) * 100);
  const dutyCount = dutyLanguageCount(cv);
  checks.push({
    id: "no-duty-language",
    category: "impact",
    label: "No duty-only language",
    bestPractice: 'Avoid "Responsible for", "Helped with", "Assisted" openers.',
    yourStatus:
      dutyCount > 0
        ? `${dutyCount} bullet(s) with weak openers`
        : weakRate > 50
          ? `${weakRate}% weak bullets`
          : "Bullets use strong action language",
    status:
      dutyCount > 0 ? "fail" : weakRate > 50 ? "warn" : weakRate > 25 ? "warn" : "pass",
    suggestion:
      dutyCount > 0 || weakRate > 25
        ? "Start bullets with Led, Built, Delivered, Reduced, Improved…"
        : undefined,
  });

  const recentRole = experience[0];
  const recentBullets = recentRole?.bullets.filter(Boolean).length ?? 0;
  checks.push({
    id: "recent-role-depth",
    category: "structure",
    label: "Recent role prominence",
    bestPractice: "Most recent role: 3–7 achievement bullets — recruiters scan here first.",
    yourStatus: recentRole
      ? `${recentBullets} bullets under "${recentRole.title}"`
      : "No experience listed",
    status:
      recentBullets >= 3 ? "pass" : recentBullets >= 1 ? "warn" : "fail",
    suggestion:
      recentBullets < 3
        ? "Add 1–2 more result-focused bullets to your most recent role."
        : undefined,
  });

  // ── Recruiter scan signals ──────────────────────────────────────────────────
  const metadataComplete = experience.every(
    (r) => r.title.trim() && r.company.trim() && r.startDate.trim()
  );
  checks.push({
    id: "experience-metadata",
    category: "structure",
    label: "Clear titles, companies & dates",
    bestPractice: "Every role shows title, company, and Month/Year dates for ATS + recruiters.",
    yourStatus: metadataComplete
      ? "All roles have title, company, and dates"
      : "Some roles missing title, company, or dates",
    status: metadataComplete ? "pass" : "fail",
  });

  const contactComplete =
    Boolean(header.fullName.trim()) &&
    Boolean(header.email.trim()) &&
    Boolean(header.phone.trim());
  checks.push({
    id: "contact-header",
    category: "structure",
    label: "Contact information",
    bestPractice: "Name, phone, professional email, city — visible in the header.",
    yourStatus: contactComplete ? "Complete" : "Missing name, email, or phone",
    status: contactComplete ? "pass" : "fail",
  });

  // ── Composite score ─────────────────────────────────────────────────────────
  const statusPoints: Record<BestPracticeStatus, number> = {
    pass: 100,
    warn: 55,
    fail: 15,
  };
  const overallScore = Math.round(
    checks.reduce((sum, c) => sum + statusPoints[c.status], 0) / checks.length
  );

  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const readiness = readinessFromChecks(checks);

  return {
    overallScore,
    readiness,
    headline: headlineForReadiness(readiness, overallScore),
    checks,
    passCount,
    warnCount,
    failCount,
  };
}
