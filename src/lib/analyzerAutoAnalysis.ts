import type { ParsedJob } from "@/types";

export function shouldAutoAnalyzeJob(
  jobDescription: string,
  parsedJob: ParsedJob | null
): boolean {
  const description = jobDescription.trim();
  if (!description) return false;

  return parsedJob?.rawText.trim() !== description;
}
