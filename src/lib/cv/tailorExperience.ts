import { termAppearsInText } from "@/lib/jobDictionaries";
import type { Experience, MatchResult, ParsedJob } from "@/types";

function jobTerms(job: ParsedJob, match: MatchResult): string[] {
  return [
    ...job.atsKeywords,
    ...job.skills,
    ...job.tools,
    ...match.matchedKeywords,
  ].filter((term) => term.trim().length > 2);
}

function countTermHits(text: string, terms: string[]): number {
  return terms.reduce(
    (count, term) => (termAppearsInText(term, text) ? count + 1 : count),
    0
  );
}

/**
 * Reorders experience entries and bullets by job relevance.
 * Text is unchanged — only order is tailored for ATS scanning.
 */
export function tailorExperienceForJob(
  experience: Experience[],
  job: ParsedJob,
  match: MatchResult
): Experience[] {
  const terms = jobTerms(job, match);

  const withSortedBullets = experience.map((entry) => ({
    ...entry,
    bullets: [...entry.bullets].sort(
      (a, b) => countTermHits(b, terms) - countTermHits(a, terms)
    ),
  }));

  return [...withSortedBullets].sort((a, b) => {
    const scoreA =
      countTermHits(a.title, terms) * 2 +
      a.bullets.reduce((sum: number, bullet: string) => sum + countTermHits(bullet, terms), 0);
    const scoreB =
      countTermHits(b.title, terms) * 2 +
      b.bullets.reduce((sum: number, bullet: string) => sum + countTermHits(bullet, terms), 0);
    return scoreB - scoreA;
  });
}
