import { NextRequest, NextResponse } from "next/server";
import masterCV from "../../../../../data/master-cv.json";
import type { MasterCV } from "@/types";
import { searchJobs, buildSearchQuery, type ScoutedJob } from "@/lib/agent/jobScout";
import { parseJob } from "@/lib/parseJob";
import { matchCV } from "@/lib/matchCV";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const cv = masterCV as MasterCV;

  // Build search query from CV profile or user override
  const customQuery: string | undefined = body.query;
  const location: string | undefined = body.location;

  const inferredTitle = cv.experience[0]?.title ?? "";
  const query =
    customQuery?.trim() ||
    buildSearchQuery(cv.skills.slice(0, 5), inferredTitle);

  const jobs = await searchJobs(query, location);

  // Score each job against the CV using existing matchCV logic
  const scored: ScoutedJob[] = await Promise.all(
    jobs.map(async (job) => {
      try {
        const description = job.description ?? `${job.title} at ${job.company}. Tags: ${job.tags.join(", ")}`;
        const parsed = parseJob(description);
        const match = matchCV(parsed);
        return { ...job, matchScore: match.score };
      } catch {
        return job;
      }
    })
  );

  // Sort by match score descending
  const sorted = scored.sort(
    (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)
  );

  return NextResponse.json({
    jobs: sorted,
    query,
    totalFound: sorted.length,
    hasAdzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY),
  });
}
