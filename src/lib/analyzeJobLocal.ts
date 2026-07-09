import {
  personaIdToLanguage,
  resolvePersonaId,
} from "@/lib/cvLanguage";
import { validateGeneratedCV } from "@/lib/cv/validateCV";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import { generateCV } from "@/lib/generateCV";
import { getMasterCV, matchCV } from "@/lib/matchCV";
import { getPersona } from "@/lib/personaManager";
import { parseJob } from "@/lib/parseJob";
import type {
  CVValidationResult,
  GeneratedCoverLetter,
  GeneratedCV,
  MasterCV,
  MatchResult,
  ParsedJob,
} from "@/types";

export type AnalysisMode = "local" | "ai" | "ai-fallback";

export interface AnalyzeJobResult {
  mode: AnalysisMode;
  job: ParsedJob;
  match: MatchResult;
  generatedCV: GeneratedCV;
  generatedCoverLetter: GeneratedCoverLetter;
  validation: CVValidationResult;
}

/**
 * Heuristic-only analysis pipeline. Used as fallback when AI is unavailable or fails.
 */
export function analyzeJobLocally(
  jobDescription: string,
  sourceUrl?: string,
  cv: MasterCV = getMasterCV(),
  personaId?: string
): AnalyzeJobResult {
  const resolvedPersonaId = resolvePersonaId(personaId);
  const masterCv = cv ?? getPersona(resolvedPersonaId) ?? getMasterCV();
  const language = personaIdToLanguage(resolvedPersonaId);

  const job = parseJob(jobDescription, sourceUrl);
  const match = matchCV(job, masterCv);
  const generatedCV = generateCV(masterCv, job, match);
  const generatedCoverLetter = generateCoverLetter(masterCv, job, language);
  const validation = validateGeneratedCV(generatedCV, masterCv);

  return {
    mode: "local",
    job,
    match,
    generatedCV,
    generatedCoverLetter,
    validation,
  };
}
