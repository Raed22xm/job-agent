import { ParsedJobSchema } from "@/lib/ai/schemas";
import { validateGeneratedCV } from "@/lib/cv/validateCV";
import { tailorExperienceForJob } from "@/lib/cv/tailorExperience";
import { matchCV } from "@/lib/matchCV";
import type { AnalyzeJobResult } from "@/lib/analyzeJobLocal";
import type {
  GeneratedCoverLetter,
  GeneratedCV,
  MasterCV,
  MatchResult,
  ParsedJob,
} from "@/types";
import type { AIJobEnhancement } from "@/lib/ai/analyzeJobWithAI";

function pickNonEmpty(primary: string, fallback: string): string {
  const trimmed = primary.trim();
  if (!trimmed || trimmed === "Not detected" || trimmed === "Role title not detected") {
    return fallback;
  }
  return trimmed;
}

function pickStringArray(primary: string[], fallback: string[]): string[] {
  return primary.length > 0 ? primary : fallback;
}

/**
 * Merge AI-extracted job fields with heuristic baseline. rawText and sourceUrl always come from input.
 */
export function mergeParsedJob(
  heuristic: ParsedJob,
  ai: AIJobEnhancement["parsedJob"],
  rawText: string,
  sourceUrl?: string
): ParsedJob {
  const merged: ParsedJob = {
    title: pickNonEmpty(ai.title, heuristic.title),
    company: pickNonEmpty(ai.company, heuristic.company),
    location: pickNonEmpty(ai.location, heuristic.location),
    responsibilities: pickStringArray(ai.responsibilities, heuristic.responsibilities),
    requirements: pickStringArray(ai.requirements, heuristic.requirements),
    tools: pickStringArray(ai.tools, heuristic.tools),
    skills: pickStringArray(ai.skills, heuristic.skills),
    atsKeywords: pickStringArray(ai.atsKeywords, heuristic.atsKeywords),
    rawText,
    sourceUrl,
  };

  const validation = ParsedJobSchema.safeParse(merged);
  return validation.success ? validation.data : heuristic;
}

/**
 * Reorder master CV skills by AI suggestion. Unknown skills are dropped; missing ones are appended.
 */
export function mergeSkillOrder(masterSkills: string[], aiOrder: string[]): string[] {
  const masterByLower = new Map(
    masterSkills.map((skill) => [skill.toLowerCase(), skill])
  );
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const skill of aiOrder) {
    const canonical = masterByLower.get(skill.toLowerCase());
    if (canonical && !seen.has(canonical.toLowerCase())) {
      ordered.push(canonical);
      seen.add(canonical.toLowerCase());
    }
  }

  for (const skill of masterSkills) {
    if (!seen.has(skill.toLowerCase())) {
      ordered.push(skill);
    }
  }

  return ordered;
}

export function mergeMatchResult(
  heuristic: MatchResult,
  aiSummary: string,
  aiFocusAreas: string[]
): MatchResult {
  return {
    ...heuristic,
    summary: aiSummary.trim() || heuristic.summary,
    recommendedFocusAreas:
      aiFocusAreas.length > 0 ? aiFocusAreas : heuristic.recommendedFocusAreas,
  };
}

export function mergeGeneratedCV(
  heuristic: GeneratedCV,
  cvSummary: string,
  skillOrder: string[],
  master: MasterCV,
  job: ParsedJob,
  match: MatchResult
): GeneratedCV {
  const skills =
    skillOrder.length > 0
      ? mergeSkillOrder(master.skills, skillOrder)
      : heuristic.sections.skills;

  const experience = tailorExperienceForJob(master.experience, job, match);

  return {
    sections: {
      header: master.personalInfo,
      summary: cvSummary.trim() || heuristic.sections.summary,
      skills,
      experience,
      education: master.education,
      ...(heuristic.sections.projects?.length
        ? { projects: heuristic.sections.projects }
        : {}),
    },
    atsNotes: [
      ...heuristic.atsNotes,
      "AI-tailored summary and skill order — verified bullets reordered for the role.",
    ],
  };
}

export function mergeAIEnhancement(
  baseline: AnalyzeJobResult,
  enhancement: AIJobEnhancement,
  cv: MasterCV,
  rawText: string,
  sourceUrl?: string
): AnalyzeJobResult {
  const job = mergeParsedJob(baseline.job, enhancement.parsedJob, rawText, sourceUrl);
  const matchFromHeuristic = rescoredMatch(job, baseline, cv);
  const match = mergeMatchResult(
    matchFromHeuristic,
    enhancement.matchSummary,
    enhancement.recommendedFocusAreas
  );

  const generatedCV = mergeGeneratedCV(
    baseline.generatedCV,
    enhancement.cvSummary,
    enhancement.skillOrder,
    cv,
    job,
    match
  );

  const generatedCoverLetter: GeneratedCoverLetter = {
    greeting: enhancement.coverLetter.greeting.trim() || baseline.generatedCoverLetter.greeting,
    paragraphs:
      enhancement.coverLetter.paragraphs.length > 0
        ? enhancement.coverLetter.paragraphs
        : baseline.generatedCoverLetter.paragraphs,
    closing:
      enhancement.coverLetter.closing.trim() || baseline.generatedCoverLetter.closing,
    signature: cv.personalInfo.fullName,
  };

  const validation = validateGeneratedCV(generatedCV, cv);

  return {
    mode: validation.valid ? "ai" : "ai-fallback",
    job,
    match,
    generatedCV: validation.valid ? generatedCV : baseline.generatedCV,
    generatedCoverLetter: validation.valid
      ? generatedCoverLetter
      : baseline.generatedCoverLetter,
    validation: validation.valid
      ? validation
      : validateGeneratedCV(baseline.generatedCV, cv),
  };
}

function rescoredMatch(
  job: ParsedJob,
  baseline: AnalyzeJobResult,
  cv: MasterCV
): MatchResult {
  const jobUnchanged =
    job.title === baseline.job.title &&
    job.company === baseline.job.company &&
    job.skills.length === baseline.job.skills.length &&
    job.atsKeywords.length === baseline.job.atsKeywords.length;

  return jobUnchanged ? baseline.match : matchCV(job, cv);
}
