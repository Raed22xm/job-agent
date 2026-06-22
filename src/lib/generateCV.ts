import type { GeneratedCV, MasterCV, MatchResult, ParsedJob } from "@/types";

/**
 * Placeholder CV generator — reorders and filters verified CV content only.
 * Does not invent experience, metrics, or skills.
 */
export function generateCV(
  cv: MasterCV,
  job: ParsedJob,
  match: MatchResult
): GeneratedCV {
  const jobKeywordSet = new Set(
    [...job.atsKeywords, ...job.skills, ...job.tools].map((k) => k.toLowerCase())
  );

  const prioritizedSkills = [
    ...cv.skills.filter((skill) =>
      jobKeywordSet.has(skill.toLowerCase()) ||
      match.matchedKeywords.some((kw) => skill.toLowerCase().includes(kw))
    ),
    ...cv.skills.filter(
      (skill) =>
        !jobKeywordSet.has(skill.toLowerCase()) &&
        !match.matchedKeywords.some((kw) => skill.toLowerCase().includes(kw))
    ),
  ];

  const tailoredSummary = cv.personalInfo.summary;

  const atsNotes = [
    "One-column ATS-friendly layout (preview only in v1).",
    "Only verified CV data included — no invented experience.",
    match.missingKeywords.length
      ? `Consider addressing gaps honestly in cover letter: ${match.missingKeywords.slice(0, 5).join(", ")}.`
      : "Strong keyword coverage from your existing CV.",
  ];

  return {
    sections: {
      header: cv.personalInfo,
      summary: tailoredSummary,
      skills: prioritizedSkills,
      experience: cv.experience,
      education: cv.education,
    },
    atsNotes,
  };
}
