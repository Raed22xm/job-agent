import {
  buildJobDescriptionText,
  fetchJson,
  htmlToPlainText,
} from "@/lib/job/scrapers/htmlUtils";
import { JobScrapeError, type JobScraper, type ScrapedJob } from "@/lib/job/scrapers/types";

interface TheHubLocation {
  address?: string;
  locality?: string;
  country?: string;
}

interface TheHubJobDoc {
  id: string;
  title: string;
  description?: string;
  location?: TheHubLocation | string;
  isRemote?: boolean;
  status?: string;
  absoluteJobUrl?: string;
  company?: {
    name?: string;
  };
}

interface TheHubJobResponse {
  doc?: TheHubJobDoc;
}

function extractJobId(url: URL): string | null {
  const match = url.pathname.match(/\/jobs\/([a-f0-9]{24})\/?$/i);
  return match?.[1] ?? null;
}

function formatLocation(doc: TheHubJobDoc): string {
  if (doc.isRemote) return "Remote";

  const location = doc.location;
  if (!location) return "";

  if (typeof location === "string") return location;

  return (
    location.address ??
    [location.locality, location.country].filter(Boolean).join(", ")
  );
}

export const theHubScraper: JobScraper = {
  provider: "thehub",

  canHandle(url: URL): boolean {
    return (
      (url.hostname === "thehub.io" || url.hostname === "www.thehub.io") &&
      Boolean(extractJobId(url))
    );
  },

  async scrape(url: URL): Promise<ScrapedJob> {
    const jobId = extractJobId(url);
    if (!jobId) {
      throw new JobScrapeError("Invalid The Hub job URL.", "unsupported_url");
    }

    let payload: TheHubJobResponse;
    try {
      payload = await fetchJson<TheHubJobResponse>(
        `https://api.thehub.io/jobs/${jobId}`
      );
    } catch {
      throw new JobScrapeError(
        "Could not fetch job from The Hub API.",
        "fetch_failed"
      );
    }

    const doc = payload.doc;
    if (!doc?.title) {
      throw new JobScrapeError("Job not found on The Hub.", "not_found");
    }

    const body = doc.description ? htmlToPlainText(doc.description) : "";
    if (body.length < 40) {
      throw new JobScrapeError(
        "The Hub job description was empty or too short.",
        "parse_failed"
      );
    }

    const company = doc.company?.name?.trim() || "Not detected";
    const location = formatLocation(doc);
    const sourceUrl = doc.absoluteJobUrl ?? url.toString();
    const inactive = doc.status ? doc.status !== "ACTIVE" : false;

    return {
      sourceUrl,
      title: doc.title.trim(),
      company,
      location: location || "Not detected",
      jobDescription: buildJobDescriptionText({
        title: doc.title.trim(),
        company,
        location: location || "Not detected",
        body,
      }),
      provider: "thehub",
      inactive,
      warning: inactive ? "This job is no longer active on The Hub." : undefined,
    };
  },
};
