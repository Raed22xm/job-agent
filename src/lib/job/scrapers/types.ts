export type JobScraperProvider = "thehub" | "jobindex" | "linkedin";

export interface ScrapedJob {
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  jobDescription: string;
  provider: JobScraperProvider;
  warning?: string;
  inactive?: boolean;
}

export class JobScrapeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unsupported_url"
      | "fetch_failed"
      | "parse_failed"
      | "blocked"
      | "not_found" = "parse_failed"
  ) {
    super(message);
    this.name = "JobScrapeError";
  }
}

export interface JobScraper {
  provider: JobScraperProvider;
  canHandle(url: URL): boolean;
  scrape(url: URL): Promise<ScrapedJob>;
}
