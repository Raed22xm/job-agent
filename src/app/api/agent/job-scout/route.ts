import { NextRequest, NextResponse } from "next/server";
import masterCV from "../../../../../data/master-cv.json";
import type { MasterCV } from "@/types";
import { searchJobs, buildSearchQuery, type ScoutedJob } from "@/lib/agent/jobScout";
import { parseJob } from "@/lib/parseJob";
import { matchCV } from "@/lib/matchCV";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const cv = masterCV as MasterCV;

  const customQuery: string | undefined = body.query;
  const location: string | undefined = body.location;
  const markets: ("remote" | "dk" | "global")[] = body.markets ?? ["remote", "dk"];

  const inferredTitle = cv.experience[0]?.title ?? "";
  const query =
    customQuery?.trim() ||
    buildSearchQuery(cv.skills.slice(0, 5), inferredTitle);

  const jobs = await searchJobs(query, location, markets);

  // Score each job against the CV using existing matchCV logic
  const scored: ScoutedJob[] = await Promise.all(
    jobs.map(async (job) => {
      try {
        const description =
          job.description ??
          `${job.title} at ${job.company}. Tags: ${job.tags.join(", ")}`;
        const parsed = parseJob(description);
        const match = matchCV(parsed);
        return { ...job, matchScore: match.score };
      } catch {
        return job;
      }
    })
  );

  // Sort: Danish sources first within same score tier, then by score
  const sorted = scored.sort((a, b) => {
    const scoreDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
    if (Math.abs(scoreDiff) > 5) return scoreDiff;
    const dkSources = new Set(["jobnet", "jobindex"]);
    const aDK = dkSources.has(a.source) ? 1 : 0;
    const bDK = dkSources.has(b.source) ? 1 : 0;
    return bDK - aDK || scoreDiff;
  });

  const dkCount = sorted.filter(
    (j) => j.source === "jobnet" || j.source === "jobindex" ||
            (j.source === "adzuna" && j.tags.includes("DK"))
  ).length;

  return NextResponse.json({
    jobs: sorted,
    query,
    totalFound: sorted.length,
    dkCount,
    hasAdzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY),
    markets,
  });
}
