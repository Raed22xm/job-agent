import { tailorExperienceForJob } from "@/lib/cv/tailorExperience";
import type { GeneratedCV, MasterCV, MatchResult, ParsedJob, Project } from "@/types";

/**
 * Tailors verified CV content for ATS: skill order, experience/bullet order, relevant projects.
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
    ...cv.skills.filter(
      (skill) =>
        jobKeywordSet.has(skill.toLowerCase()) ||
        match.matchedKeywords.some((kw) => skill.toLowerCase().includes(kw))
    ),
    ...cv.skills.filter(
      (skill) =>
        !jobKeywordSet.has(skill.toLowerCase()) &&
        !match.matchedKeywords.some((kw) => skill.toLowerCase().includes(kw))
    ),
  ];

  const tailoredExperience = tailorExperienceForJob(cv.experience, job, match);
  const relevantProjects = selectRelevantProjects(cv.projects ?? [], job, match);

  const atsNotes = [
    "One-column ATS-friendly layout.",
    "Only verified CV data — experience bullets reordered by job relevance.",
    match.missingKeywords.length
      ? `Gaps to address honestly: ${match.missingKeywords.slice(0, 5).join(", ")}.`
      : "Strong keyword coverage from your existing CV.",
  ];

  return {
    sections: {
      header: cv.personalInfo,
      summary: cv.personalInfo.summary,
      skills: prioritizedSkills,
      experience: tailoredExperience,
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

  // Score each project based on how many job keywords it matches
  const scoredProjects = projects.map((project) => {
    const text = `${project.name} ${project.description}`.toLowerCase();
    let score = 0;
    
    for (const term of jobTerms) {
      if (term.length > 2 && text.includes(term)) {
        score++;
      }
    }
    
    return { project, score };
  });

  // Sort projects by score (highest match first)
  scoredProjects.sort((a, b) => b.score - a.score);

  // Return all projects that have at least one keyword match.
  // If no projects match any keywords, return the top 2 default projects.
  const relevant = scoredProjects.filter((p) => p.score > 0).map((p) => p.project);

  return relevant.length > 0 ? relevant : projects.slice(0, 2);
}
