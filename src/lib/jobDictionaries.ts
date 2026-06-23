/** Curated skill and tool terms used for demo extraction and ATS matching. */
export const KNOWN_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "SQL",
  "REST APIs",
  "GraphQL",
  "Git",
  "Agile",
  "Scrum",
  "HTML",
  "CSS",
  "Technical documentation",
  "Problem solving",
  "Communication",
  "Leadership",
  "Mentoring",
  "Full-stack",
  "Frontend",
  "Backend",
  "API design",
  "Performance optimization",
  "Unit testing",
  "Integration testing",
] as const;

export const KNOWN_TOOLS = [
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GitHub",
  "GitLab",
  "Jest",
  "Cypress",
  "CI/CD",
  "Figma",
  "Jira",
  "VS Code",
  "Webpack",
  "Terraform",
  "Linux",
] as const;

/** Bidirectional alias groups for ATS term matching (Danish/English job ads). */
export const TERM_ALIAS_GROUPS: readonly string[][] = [
  ["rest apis", "rest api", "restful"],
  ["ci/cd", "ci cd", "continuous integration"],
  ["postgresql", "postgres"],
  ["node.js", "nodejs", "node js"],
  ["next.js", "nextjs", "next js"],
  ["frontend", "front-end", "front end", "front-end development"],
  ["danish", "dansk"],
  ["english", "engelsk"],
  ["copenhagen", "københavn"],
  ["denmark", "danmark"],
];

export const LANGUAGE_TERMS = new Set([
  "danish",
  "dansk",
  "english",
  "engelsk",
]);

export function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function expandTermAliases(term: string): string[] {
  const normalized = normalizeTerm(term);
  const expanded = new Set<string>([normalized]);

  for (const group of TERM_ALIAS_GROUPS) {
    const inGroup = group.some(
      (alias) =>
        normalized === alias ||
        normalized.includes(alias) ||
        alias.includes(normalized)
    );
    if (inGroup) {
      group.forEach((alias) => expanded.add(alias));
    }
  }

  return Array.from(expanded);
}

export function termsAreEquivalent(a: string, b: string): boolean {
  const aVariants = expandTermAliases(a);
  const bVariants = expandTermAliases(b);

  if (aVariants.some((av) => bVariants.includes(av))) return true;

  const na = normalizeTerm(a);
  const nb = normalizeTerm(b);
  return na.includes(nb) || nb.includes(na);
}

export function termAppearsInText(term: string, text: string): boolean {
  const normalizedText = normalizeTerm(text);
  const variants = expandTermAliases(term);

  return variants.some((variant) => normalizedText.includes(variant));
}

export function extractKnownTerms(
  text: string,
  dictionary: readonly string[]
): string[] {
  return dictionary.filter((term) => termAppearsInText(term, text));
}

export function isLanguageTerm(term: string): boolean {
  const normalized = normalizeTerm(term);
  if (LANGUAGE_TERMS.has(normalized)) return true;
  return expandTermAliases(term).some((variant) => LANGUAGE_TERMS.has(variant));
}
