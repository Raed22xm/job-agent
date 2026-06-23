import type { GeneratedCoverLetter, MasterCV, MatchResult, ParsedJob } from "@/types";

export interface LinkedInMessageDraft {
  connectionNote: string;
  inMail: string;
}

function displayValue(value: string, fallback: string): string {
  return value === "Not detected" || value === "Role title not detected"
    ? fallback
    : value;
}

/**
 * Local LinkedIn draft from verified CV facts only. Human review required before sending.
 */
export function generateLinkedInMessage(
  cv: MasterCV,
  job: ParsedJob,
  match?: MatchResult | null
): LinkedInMessageDraft {
  const company = displayValue(job.company, "your company");
  const title = displayValue(job.title, "this role");
  const recentRole = cv.experience[0];
  const topSkills = cv.skills.slice(0, 3).join(", ");
  const matched =
    match?.matchedKeywords.slice(0, 2).join(" and ") || topSkills;

  const connectionNote = `Hi — I saw the ${title} opening${company !== "your company" ? ` at ${company}` : ""} and wanted to connect. My background in ${matched} (${recentRole?.title ?? "software development"} at ${recentRole?.company ?? "my current role"}) looks like a strong fit. Would appreciate staying in touch.`;

  const inMail = `Hi,

I am interested in the ${title} role${company !== "your company" ? ` at ${company}` : ""}. I am completing my IT-økonomi degree at DTU and have hands-on experience as ${recentRole?.title ?? "a developer"} at ${recentRole?.company ?? "my current company"}, working with ${topSkills}.

${match ? `From the posting, I see overlap in ${match.matchedKeywords.slice(0, 4).join(", ") || "several areas"}.` : ""} I would welcome a brief chat if you are open to it.

Best regards,
${cv.personalInfo.fullName}`;

  return { connectionNote, inMail };
}
