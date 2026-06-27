import type { GeneratedCV } from "@/types";

export type FeedbackSeverity = "tip" | "warning" | "error";

export interface FeedbackItem {
  severity: FeedbackSeverity;
  section: "summary" | "skills" | "experience" | "overall";
  message: string;
  suggestion?: string;
}

// ─── Weak openers / duty phrases ───────────────────────────────────────────
const WEAK_OPENERS = [
  /^i am\b/i,
  /^i have\b/i,
  /^responsible for\b/i,
  /^duties included?\b/i,
  /^helped (with|to)\b/i,
  /^assisted (with|in)\b/i,
  /^worked on\b/i,
  /^was involved in\b/i,
];

// Strong action verbs — if a bullet starts with one, it scores better
const STRONG_VERBS = new Set([
  "led", "built", "designed", "developed", "launched", "delivered",
  "implemented", "created", "managed", "optimized", "reduced", "increased",
  "improved", "automated", "architected", "scaled", "migrated", "refactored",
  "mentored", "drove", "shipped", "integrated", "deployed", "established",
  "defined", "spearheaded", "transformed", "streamlined", "negotiated",
  "secured", "exceeded", "achieved", "generated", "saved", "cut",
  "analysed", "analyzed", "coordinated", "facilitated", "produced",
  "published", "resolved", "standardized", "upgraded", "wrote",
]);

const VAGUE_SKILLS = new Set([
  "good communication", "communication skills", "team player",
  "hardworking", "fast learner", "motivated", "proactive",
  "problem solving", "critical thinking",
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

function startsWithStrongVerb(bullet: string): boolean {
  const first = bullet.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return STRONG_VERBS.has(first);
}

export function hasWeakOpener(text: string): boolean {
  return WEAK_OPENERS.some((re) => re.test(text.trim()));
}

/** 0–100 quality score for a single bullet */
export function scoreBullet(bullet: string): number {
  if (!bullet.trim()) return 0;
  let score = 40; // baseline
  if (startsWithStrongVerb(bullet)) score += 30;
  if (hasNumber(bullet)) score += 20;
  if (!hasWeakOpener(bullet)) score += 10;
  return Math.min(score, 100);
}

export type BulletQuality = "strong" | "moderate" | "weak";

export function bulletQuality(bullet: string): BulletQuality {
  const s = scoreBullet(bullet);
  if (s >= 80) return "strong";
  if (s >= 50) return "moderate";
  return "weak";
}

// ─── Main feedback analyser ─────────────────────────────────────────────────

export function analyseCVFeedback(cv: GeneratedCV): FeedbackItem[] {
  const items: FeedbackItem[] = [];
  const { summary, skills, experience } = cv.sections;

  // ── Summary ──────────────────────────────────────────────────────────────
  const wc = wordCount(summary);
  if (wc === 0) {
    items.push({
      severity: "error",
      section: "summary",
      message: "Summary is empty.",
      suggestion: "Write 60–120 words describing your role, top skills, and value.",
    });
  } else if (wc < 40) {
    items.push({
      severity: "warning",
      section: "summary",
      message: `Summary is too short (${wc} words).`,
      suggestion: "Aim for 60–120 words to give recruiters enough context.",
    });
  } else if (wc > 150) {
    items.push({
      severity: "warning",
      section: "summary",
      message: `Summary is too long (${wc} words).`,
      suggestion: "Trim to under 120 words — recruiters scan, not read.",
    });
  }

  if (hasWeakOpener(summary)) {
    items.push({
      severity: "warning",
      section: "summary",
      message: 'Summary starts with a weak opener ("I am…", "Responsible for…").',
      suggestion:
        'Lead with your job title and years of experience instead. E.g. "Senior Software Engineer with 6 years of experience…"',
    });
  }

  if (summary && !hasNumber(summary)) {
    items.push({
      severity: "tip",
      section: "summary",
      message: "Summary contains no quantifiable achievement.",
      suggestion:
        "Add one metric (e.g. team size, revenue, % improvement) to immediately signal impact.",
    });
  }

  // ── Skills ───────────────────────────────────────────────────────────────
  const skillCount = skills.length;
  if (skillCount === 0) {
    items.push({
      severity: "error",
      section: "skills",
      message: "No skills listed.",
      suggestion: "Add 8–15 verified skills from your master CV.",
    });
  } else if (skillCount < 5) {
    items.push({
      severity: "warning",
      section: "skills",
      message: `Only ${skillCount} skills listed — ATS systems expect more coverage.`,
      suggestion: "Aim for 8–15 skills ranked by job relevance.",
    });
  } else if (skillCount > 20) {
    items.push({
      severity: "tip",
      section: "skills",
      message: `Skills list is long (${skillCount} items).`,
      suggestion:
        "Trim to the 12–15 most relevant skills for this specific role. Quality over quantity.",
    });
  }

  for (const skill of skills) {
    if (VAGUE_SKILLS.has(skill.toLowerCase().trim())) {
      items.push({
        severity: "warning",
        section: "skills",
        message: `"${skill}" is too vague for a skills section.`,
        suggestion: "Replace with a concrete, tool-specific skill.",
      });
    }
  }

  // Check for duplicates (case-insensitive)
  const seen = new Set<string>();
  for (const skill of skills) {
    const norm = skill.toLowerCase().trim();
    if (seen.has(norm)) {
      items.push({
        severity: "tip",
        section: "skills",
        message: `Duplicate skill detected: "${skill}".`,
        suggestion: "Remove duplicates to keep the list clean.",
      });
    }
    seen.add(norm);
  }

  // ── Experience bullets ────────────────────────────────────────────────────
  let weakBulletCount = 0;
  let totalBullets = 0;

  for (const role of experience) {
    for (const bullet of role.bullets) {
      if (!bullet.trim()) continue;
      totalBullets++;
      const quality = bulletQuality(bullet);
      if (quality === "weak") weakBulletCount++;

      if (hasWeakOpener(bullet)) {
        items.push({
          severity: "warning",
          section: "experience",
          message: `Bullet under "${role.title}" uses a weak opener.`,
          suggestion: `Replace "${bullet.split(" ").slice(0, 3).join(" ")}…" with a strong action verb (Led, Built, Delivered…).`,
        });
      } else if (!startsWithStrongVerb(bullet) && !hasNumber(bullet)) {
        items.push({
          severity: "tip",
          section: "experience",
          message: `Bullet under "${role.title}" lacks a strong verb and quantification.`,
          suggestion: "Start with an action verb and include a number to show impact.",
        });
      } else if (!hasNumber(bullet)) {
        items.push({
          severity: "tip",
          section: "experience",
          message: `Bullet under "${role.title}" has no metric.`,
          suggestion:
            "Add a number (%, team size, timeframe) to quantify impact where possible.",
        });
      }
    }
  }

  // Overall summary
  if (totalBullets > 0 && weakBulletCount / totalBullets > 0.5) {
    items.push({
      severity: "warning",
      section: "overall",
      message: `More than half your bullets (${weakBulletCount}/${totalBullets}) are weak.`,
      suggestion:
        "Focus on rewriting the top 3–4 bullets per role with strong verbs and metrics for maximum ATS and recruiter impact.",
    });
  }

  return items;
}

/** Aggregate 0–100 bullet quality score across all experience */
export function bulletImpactScore(cv: GeneratedCV): number {
  const bullets = cv.sections.experience.flatMap((r) => r.bullets).filter(Boolean);
  if (bullets.length === 0) return 0;
  const total = bullets.reduce((sum, b) => sum + scoreBullet(b), 0);
  return Math.round(total / bullets.length);
}

/** 0–100 summary quality score */
export function summaryQualityScore(cv: GeneratedCV): number {
  const { summary } = cv.sections;
  if (!summary.trim()) return 0;
  const wc = wordCount(summary);
  let score = 0;
  if (wc >= 40 && wc <= 150) score += 40;
  else if (wc > 0) score += 15;
  if (!hasWeakOpener(summary)) score += 30;
  if (hasNumber(summary)) score += 30;
  return Math.min(score, 100);
}
