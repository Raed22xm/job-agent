import { jobindexScraper } from "@/lib/job/scrapers/jobindex";
import { linkedInScraper } from "@/lib/job/scrapers/linkedin";
import { theHubScraper } from "@/lib/job/scrapers/theHub";
import {
  JobScrapeError,
  type JobScraper,
  type JobScraperProvider,
  type ScrapedJob,
} from "@/lib/job/scrapers/types";

export { JobScrapeError, type JobScraperProvider, type ScrapedJob };

const SCRAPERS: JobScraper[] = [theHubScraper, jobindexScraper, linkedInScraper];

export function parseJobUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new JobScrapeError("Job URL is required.", "unsupported_url");
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
    return url;
  } catch {
    throw new JobScrapeError("Invalid job URL.", "unsupported_url");
  }
}

export function detectJobScraper(url: URL): JobScraper | null {
  return SCRAPERS.find((scraper) => scraper.canHandle(url)) ?? null;
}

export function detectJobScraperProvider(
  url: URL
): JobScraperProvider | null {
  return detectJobScraper(url)?.provider ?? null;
}

export async function scrapeJobUrl(input: string): Promise<ScrapedJob> {
  const url = parseJobUrl(input);
  const scraper = detectJobScraper(url);

  if (!scraper) {
    throw new JobScrapeError(
      "Unsupported job URL. Supported sites: thehub.io, jobindex.dk, linkedin.com/jobs/view/…",
      "unsupported_url"
    );
  }

  return scraper.scrape(url);
}
