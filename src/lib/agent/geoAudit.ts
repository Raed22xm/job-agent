/**
 * Geo Audit — analyses master CV skills against geographic job markets.
 * Uses verified master-cv.json facts only. Never invents data.
 */
import type { MasterCV } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationScore {
  id: string;
  city: string;
  country: string;
  flag: string;
  demandScore: number; // 0-100: how well CV skills match local market
  estimatedRoles: number; // rough open-role estimate for the skill set
  salaryBand: string; // e.g. "45 000 – 60 000 DKK/mo"
  languageBarrier: "None" | "Low" | "Medium" | "High";
  commuteFromHome: string; // distance / time from Kastrup
  remoteEligible: boolean;
  topMatchingSkills: string[];
  marketNote: string;
  tier: "Top Pick" | "Strong" | "Viable" | "Stretch";
}

export interface GeoAuditResult {
  locations: LocationScore[];
  topRecommendation: LocationScore;
  recommendationReason: string;
  aiNarrative?: string;
  mode: "ai" | "local" | "local-fallback";
}

// ─── Static market demand data ────────────────────────────────────────────────
// Demand weight per skill per location (0 = not relevant, 3 = high demand).
// Sourced from DK job board signals & Eurostat tech hiring indices (2024-2025).

type SkillDemandMap = Record<string, number>;

const LOCATION_DEMAND: Record<string, SkillDemandMap> = {
  copenhagen: {
    TypeScript: 3, React: 3, "Next.js": 3, "Node.js": 3,
    Java: 2, "Spring Boot": 2, Python: 3, PostgreSQL: 2,
    Prisma: 2, Figma: 2, Docker: 3, "CI/CD": 3,
    "REST API": 3, "UI/UX Design": 2, "Tailwind CSS": 2,
    "Power BI": 1, Agile: 2, Scrum: 2, "Azure DevOps": 2,
  },
  aarhus: {
    TypeScript: 2, React: 2, "Next.js": 2, "Node.js": 2,
    Java: 3, "Spring Boot": 3, Python: 2, PostgreSQL: 2,
    Docker: 2, "CI/CD": 2, "REST API": 3, Agile: 3, Scrum: 3,
    "Power BI": 2, "UI/UX Design": 1,
  },
  odense: {
    TypeScript: 2, React: 2, "Next.js": 1, "Node.js": 2,
    Java: 3, "Spring Boot": 2, Python: 2, PostgreSQL: 1,
    Docker: 1, "REST API": 2, Agile: 2, Scrum: 2,
    "Power BI": 2, Robotics: 1,
  },
  aalborg: {
    TypeScript: 1, React: 1, "Next.js": 1, "Node.js": 1,
    Java: 2, Python: 2, PostgreSQL: 1, "REST API": 2,
    Agile: 2, Scrum: 2, Docker: 1,
  },
  remote_eu: {
    TypeScript: 3, React: 3, "Next.js": 3, "Node.js": 3,
    Java: 2, "Spring Boot": 2, Python: 3, PostgreSQL: 3,
    Prisma: 3, Docker: 3, "CI/CD": 3, "REST API": 3,
    "UI/UX Design": 3, Figma: 3, "Tailwind CSS": 3, Agile: 3,
  },
  remote_global: {
    TypeScript: 3, React: 3, "Next.js": 3, "Node.js": 3,
    Java: 2, Python: 3, PostgreSQL: 2, Docker: 3, "CI/CD": 3,
    "REST API": 3, "UI/UX Design": 2, Figma: 2, Agile: 3,
  },
};

const LOCATION_META: Record<
  string,
  Omit<LocationScore, "demandScore" | "estimatedRoles" | "topMatchingSkills" | "marketNote" | "tier">
> = {
  copenhagen: {
    id: "copenhagen",
    city: "Copenhagen",
    country: "Denmark",
    flag: "🇩🇰",
    salaryBand: "45 000 – 65 000 DKK/mo",
    languageBarrier: "None",
    commuteFromHome: "~18 min by metro from Kastrup",
    remoteEligible: false,
  },
  aarhus: {
    id: "aarhus",
    city: "Aarhus",
    country: "Denmark",
    flag: "🇩🇰",
    salaryBand: "40 000 – 58 000 DKK/mo",
    languageBarrier: "None",
    commuteFromHome: "~3 h by train from Kastrup",
    remoteEligible: true,
  },
  odense: {
    id: "odense",
    city: "Odense",
    country: "Denmark",
    flag: "🇩🇰",
    salaryBand: "38 000 – 55 000 DKK/mo",
    languageBarrier: "None",
    commuteFromHome: "~1.5 h by train from Kastrup",
    remoteEligible: true,
  },
  aalborg: {
    id: "aalborg",
    city: "Aalborg",
    country: "Denmark",
    flag: "🇩🇰",
    salaryBand: "36 000 – 50 000 DKK/mo",
    languageBarrier: "None",
    commuteFromHome: "~5 h by train from Kastrup",
    remoteEligible: true,
  },
  remote_eu: {
    id: "remote_eu",
    city: "Remote (EU)",
    country: "Europe",
    flag: "🇪🇺",
    salaryBand: "40 000 – 80 000 DKK/mo equiv.",
    languageBarrier: "Low",
    commuteFromHome: "No commute",
    remoteEligible: true,
  },
  remote_global: {
    id: "remote_global",
    city: "Remote (Global)",
    country: "Worldwide",
    flag: "🌍",
    salaryBand: "35 000 – 120 000 DKK/mo equiv.",
    languageBarrier: "Medium",
    commuteFromHome: "No commute",
    remoteEligible: true,
  },
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function scoreLocation(
  skills: string[],
  locationId: string
): { score: number; topSkills: string[]; estimatedRoles: number } {
  const demandMap = LOCATION_DEMAND[locationId] ?? {};
  let totalWeight = 0;
  let earnedWeight = 0;
  const matched: Array<{ skill: string; weight: number }> = [];

  for (const skill of skills) {
    const weight = demandMap[skill] ?? 0;
    totalWeight += 3; // max per skill
    earnedWeight += weight;
    if (weight > 0) matched.push({ skill, weight });
  }

  const rawScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
  const score = Math.min(100, Math.round(rawScore * 1.4)); // scale up slightly

  matched.sort((a, b) => b.weight - a.weight);
  const topSkills = matched.slice(0, 5).map((m) => m.skill);

  // Role estimate: rough heuristic based on market size × score
  const marketSizes: Record<string, number> = {
    copenhagen: 1800, aarhus: 600, odense: 350,
    aalborg: 200, remote_eu: 4000, remote_global: 8000,
  };
  const base = marketSizes[locationId] ?? 200;
  const estimatedRoles = Math.round((score / 100) * base);

  return { score, topSkills, estimatedRoles };
}

function assignTier(score: number): LocationScore["tier"] {
  if (score >= 75) return "Top Pick";
  if (score >= 60) return "Strong";
  if (score >= 45) return "Viable";
  return "Stretch";
}

function buildMarketNote(
  locationId: string,
  score: number,
  topSkills: string[]
): string {
  if (locationId === "copenhagen") {
    return score >= 70
      ? "Strong tech ecosystem — React, TypeScript, and Next.js are highly sought after here."
      : "Competitive market but solid demand for your stack.";
  }
  if (locationId === "remote_eu") {
    return "EU remote roles reward full-stack generalists — your React/Next.js + Spring Boot combination is marketable.";
  }
  if (locationId === "remote_global") {
    return `Global remote is highly competitive. Your top skills (${topSkills.slice(0, 2).join(", ")}) are in demand, but English-only applications may limit reach.`;
  }
  if (locationId === "aarhus") {
    return "Growing tech scene with strong Java/Spring Boot demand; React roles are increasing.";
  }
  if (locationId === "odense") {
    return "Emerging tech hub — automation and enterprise software dominate hiring.";
  }
  if (locationId === "aalborg") {
    return "Smaller market; best suited if targeting embedded or academia-adjacent roles.";
  }
  return "Market data based on aggregated DK job board signals.";
}

// ─── Fallback (no AI) ─────────────────────────────────────────────────────────

export function fallbackGeoAudit(cv: MasterCV): GeoAuditResult {
  const allSkills = [...cv.skills, ...cv.tools];
  const locationIds = Object.keys(LOCATION_META);

  const locations: LocationScore[] = locationIds.map((id) => {
    const { score, topSkills, estimatedRoles } = scoreLocation(allSkills, id);
    const meta = LOCATION_META[id];
    return {
      ...meta,
      demandScore: score,
      estimatedRoles,
      topMatchingSkills: topSkills,
      marketNote: buildMarketNote(id, score, topSkills),
      tier: assignTier(score),
    };
  });

  locations.sort((a, b) => b.demandScore - a.demandScore);

  const top = locations[0];
  const reason =
    top.id === "copenhagen"
      ? `Copenhagen offers the best skill-demand match (${top.demandScore}/100) with no commute penalty — you're already based in Kastrup.`
      : top.id === "remote_eu"
      ? `EU remote roles provide the highest demand score (${top.demandScore}/100) with full location flexibility.`
      : `${top.city} scores highest at ${top.demandScore}/100 for your current skill set.`;

  return {
    locations,
    topRecommendation: top,
    recommendationReason: reason,
    mode: "local",
  };
}

// ─── AI prompt ────────────────────────────────────────────────────────────────

export function buildGeoAuditPrompt(
  cv: MasterCV,
  scores: LocationScore[]
): string {
  const skillList = [...cv.skills, ...cv.tools].slice(0, 20).join(", ");
  const scoreLines = scores
    .map(
      (l) =>
        `- ${l.flag} ${l.city}: demand ${l.demandScore}/100, ~${l.estimatedRoles} open roles, salary ${l.salaryBand}`
    )
    .join("\n");

  return `You are a career coach specialising in the Danish and European tech job market.

The candidate is ${cv.personalInfo.fullName}, a ${cv.experience[0]?.title ?? "software developer"} based in ${cv.personalInfo.location}.
Their key skills: ${skillList}.

Pre-computed location demand scores:
${scoreLines}

Write a concise 3–4 sentence narrative (no bullet points, no headers) that:
1. Identifies the best geographic opportunity for this candidate
2. Explains why Copenhagen or remote is the practical first choice
3. Notes one actionable step to unlock the next-best market
Keep it direct, data-driven, and avoid generic advice. Max 80 words.`;
}
