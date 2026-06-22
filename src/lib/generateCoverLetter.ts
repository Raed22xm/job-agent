import type { GeneratedCoverLetter, MasterCV, ParsedJob } from "@/types";

/**
 * Placeholder cover letter generator using verified CV facts only.
 * Replace with LLM-assisted drafting once API integration is added.
 */
export function generateCoverLetter(
  cv: MasterCV,
  job: ParsedJob
): GeneratedCoverLetter {
  const recentRole = cv.experience[0];

  const paragraphs = [
    `I am writing to express my interest in the ${job.title} position at ${job.company}. With experience as ${recentRole?.title ?? "a professional"} at ${recentRole?.company ?? "my current organization"}, I am confident my background aligns with the role's focus areas.`,
    `My work has included ${cv.skills.slice(0, 4).join(", ")}, and I have consistently delivered results while collaborating across teams. I am particularly drawn to this opportunity because of ${job.company}'s work in ${job.location}.`,
    `I would welcome the chance to discuss how my verified experience can support your team. Thank you for your time and consideration.`,
  ];

  return {
    greeting: `Dear Hiring Manager,`,
    paragraphs,
    closing: "Sincerely,",
    signature: cv.personalInfo.fullName,
  };
}
