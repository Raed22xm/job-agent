import {
  expandTermAliases,
  normalizeTerm,
  termAppearsInText,
  termsAreEquivalent,
} from "@/lib/jobDictionaries";
import type { MasterCV } from "@/types";

export type GapStatus = "gap" | "transferable";

export interface GapSuggestion {
  missing: string;
  status: GapStatus;
  message: string;
  relatedVerified?: string[];
}

/** Related verified skills/tools for common job terms — no fabrication. */
const TRANSFERABLE_HINTS: Record<string, string[]> = {
  android: ["Kotlin", "Java", "React"],
  kotlin: ["Java", "Kotlin"],
  swift: ["Java", "JavaScript"],
  ios: ["React", "JavaScript", "Figma"],
  docker: ["Git", "REST API"],
  kubernetes: ["Git", "REST API"],
  aws: ["REST API", "SQL"],
  azure: ["Power BI", "SQL"],
  "unit testing": ["Java", "JavaScript", "React"],
  testing: ["Java", "JavaScript", "React"],
  ux: ["Figma", "Front-end development"],
  ui: ["Figma", "CSS", "React"],
  dashboard: ["Power BI", "SQL", "Excel"],
  bi: ["Power BI", "SQL", "Dataanalyse"],
  agile: ["Agile"],
  scrum: ["Agile"],
  typescript: ["JavaScript", "React", "Next.js"],
  node: ["JavaScript", "REST API"],
  api: ["REST API", "Java", "JavaScript"],
  backend: ["Java", "REST API", "SQL"],
  frontend: ["React", "Next.js", "CSS", "JavaScript"],
  "front-end": ["React", "Next.js", "CSS"],
  data: ["Power BI", "SQL", "Dataanalyse", "Excel"],
  sql: ["SQL", "MariaDB", "Power BI"],
  // --- Research-backed additions ---
  "ci/cd": ["Git", "GitHub Actions"],
  cicd: ["Git", "GitHub Actions"],
  terraform: ["Git", "REST API"],
  graphql: ["REST API", "JavaScript"],
  python: ["Java", "JavaScript"],
  "machine learning": ["Dataanalyse", "SQL"],
  ml: ["Dataanalyse", "SQL"],
  microservices: ["REST API", "Java", "Spring Boot"],
  "react native": ["React", "JavaScript", "CSS"],
  vue: ["React", "JavaScript", "CSS"],
  "vue.js": ["React", "JavaScript", "CSS"],
  angular: ["React", "JavaScript"],
  mongodb: ["SQL", "MariaDB"],
  nosql: ["SQL", "MariaDB"],
  redis: ["SQL"],
  elasticsearch: ["SQL", "REST API"],
  kafka: ["REST API"],
  jenkins: ["Git"],
  gitlab: ["Git", "GitHub Actions"],
  devops: ["Git", "REST API"],
  "cloud computing": ["REST API", "SQL"],
  cloud: ["REST API", "SQL"],
  webpack: ["JavaScript", "React", "Next.js"],
  vite: ["JavaScript", "React", "Next.js"],
  "tailwind css": ["CSS", "React"],
  tailwindcss: ["CSS", "React"],
  sass: ["CSS"],
  scss: ["CSS"],
  "spring boot": ["Java", "Spring Boot", "REST API"],
  spring: ["Java", "Spring Boot"],
  jira: ["Agile"],
  confluence: ["Agile"],
  figma: ["Figma"],
};

function verifiedTerms(cv: MasterCV): string[] {
  return [...cv.skills, ...cv.tools];
}

function findRelatedVerified(
  missing: string,
  cv: MasterCV
): string[] {
  const normalized = normalizeTerm(missing);
  const hints = TRANSFERABLE_HINTS[normalized] ?? [];
  const related = new Set<string>();

  for (const hint of hints) {
    const match = verifiedTerms(cv).find(
      (term) =>
        termsAreEquivalent(term, hint) || termAppearsInText(term, hint)
    );
    if (match) related.add(match);
  }

  for (const term of verifiedTerms(cv)) {
    const aliases = expandTermAliases(term);
    if (
      aliases.some(
        (alias) =>
          normalized.includes(alias) ||
          alias.includes(normalized) ||
          termsAreEquivalent(alias, missing)
      )
    ) {
      related.add(term);
    }
  }

  for (const exp of cv.experience) {
    for (const bullet of exp.bullets) {
      if (termAppearsInText(missing, bullet)) {
        related.add(`${exp.title} at ${exp.company}`);
      }
    }
  }

  return [...related];
}

export function buildGapSuggestions(
  missingKeywords: string[],
  cv: MasterCV
): GapSuggestion[] {
  return missingKeywords.map((missing) => {
    const related = findRelatedVerified(missing, cv);

    if (related.length === 0) {
      return {
        missing,
        status: "gap",
        message:
          `Not in your verified CV. Do not claim this skill. In your cover letter, you can address it honestly: "While I have not worked directly with ${missing}, I am eager to build on my existing technical foundation to develop this competency."`,
      };
    }

    const relatedList = related.slice(0, 3).join(", ");
    const firstRelated = related[0] ?? "related technology";
    const company = cv.experience[0]?.company ?? "my current role";

    return {
      missing,
      status: "transferable",
      relatedVerified: related,
      message: `Not listed explicitly, but you have verified overlap: ${relatedList}. In your cover letter, frame it as: "While I have not used ${missing} directly, my experience with ${firstRelated} at ${company} provides a strong foundation for quick adoption."`,
    };
  });
}
