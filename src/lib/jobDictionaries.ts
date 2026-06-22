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

export function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function termAppearsInText(term: string, text: string): boolean {
  const normalizedText = normalizeTerm(text);
  const normalizedTerm = normalizeTerm(term);

  if (normalizedText.includes(normalizedTerm)) return true;

  const aliases: Record<string, string[]> = {
    "rest apis": ["rest api", "restful"],
    "ci/cd": ["ci cd", "continuous integration"],
    postgresql: ["postgres"],
    "node.js": ["nodejs", "node js"],
    "next.js": ["nextjs", "next js"],
  };

  const variants = aliases[normalizedTerm] ?? [];
  return variants.some((variant) => normalizedText.includes(variant));
}

export function extractKnownTerms(
  text: string,
  dictionary: readonly string[]
): string[] {
  return dictionary.filter((term) => termAppearsInText(term, text));
}
