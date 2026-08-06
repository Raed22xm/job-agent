import type { GeneratedCV } from "@/types";
import { KNOWN_SKILLS, KNOWN_TOOLS } from "@/lib/jobDictionaries";

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
  /^participated in\b/i,
  /^contributed to\b/i,
  /^handled\b/i,
  /^was in charge of\b/i,
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
  // --- Research-backed power verbs (Harvard + industry) ---
  "orchestrated", "mobilized", "championed", "pioneered", "accelerated",
  "amplified", "maximized", "capitalized", "engineered", "configured",
  "instrumented", "containerized", "consolidated", "overhauled",
  "eliminated", "doubled", "tripled", "halved", "revamped", "initiated",
  "formalized", "modernized", "provisioned", "benchmarked", "diagnosed",
]);

/** GPT-isms to flag with better replacements */
const GPTISM_REPLACEMENTS: Record<string, string> = {
  leveraged: "used, applied, or employed",
  utilized: "used or applied",
  utilised: "used or applied",
  synergized: "collaborated or combined",
  spearheaded: "led or initiated",
  endeavored: "worked or aimed",
  endeavoured: "worked or aimed",
  effectuated: "completed or achieved",
  liaised: "coordinated or communicated",
  interfaced: "worked with or connected",
};

/** Generic filler phrases & AI clichés to scan across all text */
const FILLER_PHRASES: Array<{ pattern: RegExp; phrase: string; suggestion: string }> = [
  {
    pattern: /\bresults[- ]driven\b/i,
    phrase: "results-driven",
    suggestion: "Remove generic cliché — let concrete numbers and outcomes show your results.",
  },
  {
    pattern: /\bteam player\b/i,
    phrase: "team player",
    suggestion: "Replace with a concrete collaboration phrase (e.g., 'Collaborated with 4 cross-functional engineers...').",
  },
  {
    pattern: /\bpassionate about\b/i,
    phrase: "passionate about",
    suggestion: "Focus on demonstrated achievements and skills rather than self-reported passion.",
  },
  {
    pattern: /\bproven track record\b/i,
    phrase: "proven track record",
    suggestion: "Provide measurable metrics (%, numbers, timelines) instead of claiming a track record.",
  },
  {
    pattern: /\bcutting[- ]edge\b/i,
    phrase: "cutting-edge",
    suggestion: "Specify the exact technologies and tools used.",
  },
  {
    pattern: /\bhit the ground running\b/i,
    phrase: "hit the ground running",
    suggestion: "State your technical skills and domain experience directly without idioms.",
  },
  {
    pattern: /\bthink outside the box\b/i,
    phrase: "think outside the box",
    suggestion: "Describe your problem-solving process or innovative technical approach specifically.",
  },
  {
    pattern: /\bdynamic environment\b/i,
    phrase: "dynamic environment",
    suggestion: "Describe the specific team size, codebase scale, or fast-paced industry setting.",
  },
  {
    pattern: /\b(my|our|min|vores)\s+(verified|verificerede?)\s+(experience|erfaring|background|baggrund)\b/i,
    phrase: "verified experience",
    suggestion: "State your experience factually without self-describing it as 'verified'.",
  },
];

const VAGUE_SKILLS = new Set([
  "good communication", "communication skills", "team player",
  "hardworking", "fast learner", "motivated", "proactive",
  "problem solving", "critical thinking",
]);

// Known tech / tool names set for specificity detection
const TECH_NAMES = new Set([
  ...KNOWN_SKILLS.map((s) => s.toLowerCase()),
  ...KNOWN_TOOLS.map((t) => t.toLowerCase()),
  "react", "next.js", "typescript", "javascript", "node.js", "spring boot",
  "power bi", "figma", "docker", "postgres", "postgresql", "sql", "java",
  "python", "rest api", "tailwind", "zod", "git", "github", "kubernetes",
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

function hasSpecificDetail(bullet: string): boolean {
  if (hasNumber(bullet)) return true;
  const lower = bullet.toLowerCase();
  for (const tech of TECH_NAMES) {
    if (lower.includes(tech)) return true;
  }
  return false;
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
  if (hasSpecificDetail(bullet)) score += 20;
  if (!hasWeakOpener(bullet)) score += 10;

  for (const item of FILLER_PHRASES) {
    if (item.pattern.test(bullet)) {
      score -= 15;
    }
  }

  return Math.max(0, Math.min(score, 100));
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
        'Lead with your job title and experience level instead. E.g. "Software Engineer with 3+ years of experience…"',
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

  // Summary filler phrases & self-verified claims check
  for (const filler of FILLER_PHRASES) {
    if (filler.pattern.test(summary)) {
      items.push({
        severity: "warning",
        section: "summary",
        message: `Summary contains generic phrase "${filler.phrase}".`,
        suggestion: filler.suggestion,
      });
    }
  }

  // Check for quotation marks wrapping claims in summary
  if (/“[^”]+”|"[^"]{4,}"/.test(summary)) {
    items.push({
      severity: "warning",
      section: "summary",
      message: "Summary uses quotation marks around claims.",
      suggestion: "Integrate claims as natural prose without quotation marks.",
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
    const verbCounts = new Map<string, number>();

    for (const bullet of role.bullets) {
      if (!bullet.trim()) continue;
      totalBullets++;
      const quality = bulletQuality(bullet);
      if (quality === "weak") weakBulletCount++;

      // Track verb repetitions within the role
      const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
      if (firstWord) {
        verbCounts.set(firstWord, (verbCounts.get(firstWord) ?? 0) + 1);
      }

      if (hasWeakOpener(bullet)) {
        items.push({
          severity: "warning",
          section: "experience",
          message: `Bullet under "${role.title}" uses a weak opener.`,
          suggestion: `Replace "${bullet.split(" ").slice(0, 3).join(" ")}…" with a strong action verb (Led, Built, Delivered…). Keep bullet short and punchy.`,
        });
      } else if (!startsWithStrongVerb(bullet) && !hasNumber(bullet)) {
        items.push({
          severity: "tip",
          section: "experience",
          message: `Bullet under "${role.title}" lacks a strong verb and quantification.`,
          suggestion: "Start with a strong action verb (Led, Built, Designed) and include a number to show impact.",
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

      // Check for vagueness / lack of specific detail
      if (!hasSpecificDetail(bullet)) {
        items.push({
          severity: "tip",
          section: "experience",
          message: `Bullet under "${role.title}" lacks concrete details (no metric, tool, or measurable outcome).`,
          suggestion: "Add one concrete detail — a tool name, a number, or a measurable result.",
        });
      }

      // Check for filler phrases / clichés
      for (const filler of FILLER_PHRASES) {
        if (filler.pattern.test(bullet)) {
          items.push({
            severity: "warning",
            section: "experience",
            message: `Bullet under "${role.title}" contains generic phrase "${filler.phrase}".`,
            suggestion: filler.suggestion,
          });
        }
      }

      // GPT-ism detection (first-word opening)
      const replacement = GPTISM_REPLACEMENTS[firstWord];
      if (replacement) {
        items.push({
          severity: "warning",
          section: "experience",
          message: `Bullet under "${role.title}" opens with "${firstWord}" — a common AI-generated word.`,
          suggestion: `Replace with a stronger, more specific action verb: ${replacement}.`,
        });
      }

      // Quotation marks check in bullets
      if (/“[^”]+”|"[^"]{4,}"/.test(bullet)) {
        items.push({
          severity: "warning",
          section: "experience",
          message: `Bullet under "${role.title}" uses quotation marks around text.`,
          suggestion: "Rephrase naturally without quotation marks.",
        });
      }
    }

    // Flag repeated opening action verbs within the same role (e.g. 2+ bullets starting with "built")
    for (const [verb, count] of verbCounts.entries()) {
      if (count >= 2 && STRONG_VERBS.has(verb)) {
        items.push({
          severity: "warning",
          section: "experience",
          message: `Multiple bullets under "${role.title}" repeat the opening verb "${verb}".`,
          suggestion: `Vary starting action verbs across bullets (e.g. alternate with Architected, Implemented, Developed, or Spearheaded).`,
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
        "Focus on rewriting bullets to start with strong action verbs and include concrete metrics or tools.",
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

