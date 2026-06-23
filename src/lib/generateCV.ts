import type { GeneratedCV, MasterCV, MatchResult, ParsedJob, Project } from "@/types";

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

  const relevantProjects = selectRelevantProjects(cv.projects ?? [], job, match);

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
      ...(relevantProjects.length > 0 ? { projects: relevantProjects } : {}),
    },
    atsNotes,
  };
}

function selectRelevantProjects(
  projects: Project[],
  job: ParsedJob,
  match: MatchResult
): Project[] {
  if (projects.length === 0) return [];

  const jobTerms = new Set(
    [...job.atsKeywords, ...job.skills, ...job.tools, ...match.matchedKeywords].map(
      (term) => term.toLowerCase()
    )
  );

  const relevant = projects.filter((project) => {
    const text = `${project.name} ${project.description}`.toLowerCase();
    return [...jobTerms].some(
      (term) => term.length > 2 && text.includes(term)
    );
  });

  return relevant.length > 0 ? relevant : projects.slice(0, 2);
}
