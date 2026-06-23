import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ScrapedJob } from "@/lib/job/scrapers/types";

function slugifySegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildJobFileSlug(company: string, title: string): string {
  const companySlug = slugifySegment(
    company === "Not detected" ? "unknown-company" : company
  );
  const titleSlug = slugifySegment(
    title === "Role title not detected" ? "unknown-role" : title
  );

  return `${companySlug}-${titleSlug}`.replace(/-+/g, "-").slice(0, 100);
}

export function formatJobMarkdown(job: ScrapedJob, savedAt = new Date()): string {
  const date = savedAt.toISOString().slice(0, 10);

  return `# ${job.title} — ${job.company}

**Location:** ${job.location}  
**Source URL:** ${job.sourceUrl}  
**Date saved:** ${date}

## Job description

${job.jobDescription}

## Notes

- Why this role interests me:
- Key requirements to highlight from my CV:
- Questions before applying:
`;
}

export async function saveJobToFile(
  job: ScrapedJob,
  workspaceRoot = process.cwd()
): Promise<string> {
  const slug = buildJobFileSlug(job.company, job.title);
  const relativePath = path.join("data", "jobs", `${slug}.md`);
  const absolutePath = path.join(workspaceRoot, relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, formatJobMarkdown(job), "utf8");

  return relativePath;
}
