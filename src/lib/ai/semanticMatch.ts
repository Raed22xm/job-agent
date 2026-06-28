import { cosineSimilarity, generateTextEmbedding } from "./embeddings";
import type { MasterCV, ParsedJob, ScoreBreakdown } from "@/types";
import { scoreJob } from "@/lib/job/scoreJob";

export async function semanticScoreJob(
  job: ParsedJob,
  cv: MasterCV
): Promise<ScoreBreakdown> {
  const baseScore = scoreJob(job, cv);

  // We only run semantic search if there are skills to match
  const jobText = [job.title, ...job.skills, ...job.tools].join(", ");
  const cvText = [cv.experience[0]?.title, ...cv.skills].join(", ");

  if (jobText.trim() === "" || cvText.trim() === "") return baseScore;

  try {
    const [jobEmb, cvEmb] = await Promise.all([
      generateTextEmbedding(jobText),
      generateTextEmbedding(cvText),
    ]);

    const similarity = cosineSimilarity(jobEmb, cvEmb);
    // similarity is usually between 0.6 and 1.0 for related text.
    // Scale it to a 0-100 score realistically.
    const semanticScore = Math.max(0, Math.min(100, (similarity - 0.5) * 200));

    // Blend the semantic score with the base skillsMatch score
    // Semantic accounts for 50% of the skillsMatch weight
    const originalSkillsScore = baseScore.skillsMatch.score;
    const blendedScore = Math.round(originalSkillsScore * 0.5 + semanticScore * 0.5);

    baseScore.skillsMatch.score = blendedScore;

    // Recalculate overall
    const categories = [
      baseScore.skillsMatch,
      baseScore.experienceMatch,
      baseScore.location,
      baseScore.language,
      baseScore.juniorFriendliness,
      baseScore.portfolioRelevance,
    ];

    const active = categories.filter((c) => c.total > 0);
    if (active.length > 0) {
      const totalWeight = active.reduce((sum, c) => sum + c.weight, 0);
      const weightedSum = active.reduce((sum, c) => sum + c.score * c.weight, 0);
      baseScore.overall = Math.round(weightedSum / totalWeight);
    }
    
    return baseScore;
  } catch (err) {
    console.error("Semantic scoring failed, falling back to keyword scoring", err);
    return baseScore;
  }
}
