import type { GeneratedCoverLetter, MasterCV, ParsedJob } from "@/types";

/**
 * Heuristic cover letter from verified CV facts. AI-enhanced version via POST /api/analyze-job?enhanceWithAI.
 */
function displayValue(value: string, fallback: string): string {
  return value === "Not detected" || value === "Role title not detected"
    ? fallback
    : value;
}

export function generateCoverLetter(
  cv: MasterCV,
  job: ParsedJob
): GeneratedCoverLetter {
  const recentRole = cv.experience[0];
  const company = displayValue(job.company, "your organization");
  const title = displayValue(job.title, "this position");
  const location = displayValue(job.location, "this opportunity");

  const paragraphs = [
    `I am writing to express my interest in the ${title} position${company !== "your organization" ? ` at ${company}` : ""}. With experience as ${recentRole?.title ?? "a professional"} at ${recentRole?.company ?? "my current organization"}, I am confident my background aligns with the role's focus areas.`,
    `My work has included ${cv.skills.slice(0, 4).join(", ")}, and I have consistently delivered results while collaborating across teams. I am particularly drawn to this opportunity${location !== "this opportunity" ? ` based in ${location}` : ""}.`,
    `I would welcome the chance to discuss how my verified experience can support your team. Thank you for your time and consideration.`,
  ];

  return {
    greeting: `Dear Hiring Manager,`,
    paragraphs,
    closing: "Sincerely,",
    signature: cv.personalInfo.fullName,
  };
}
