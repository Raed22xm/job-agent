import {
  buildJobDescriptionText,
  extractTagText,
  fetchHtml,
  htmlToPlainText,
  normalizeWhitespace,
} from "@/lib/job/scrapers/htmlUtils";
import { JobScrapeError, type JobScraper, type ScrapedJob } from "@/lib/job/scrapers/types";

function normalizeJobindexUrl(url: URL): URL {
  const match = url.pathname.match(
    /\/(?:jobannonce|vis-job)\/(h\d+)(?:\/[^/]+)?\/?$/i
  );
  if (!match?.[1]) return url;

  return new URL(`https://www.jobindex.dk/jobannonce/${match[1]}`);
}

function extractMetadataItem(html: string, label: string): string | null {
  const pattern = new RegExp(
    `aria-label="${label}"[\\s\\S]*?</svg>\\s*([^<]+)`,
    "i"
  );
  const match = html.match(pattern);
  return match?.[1] ? normalizeWhitespace(match[1]) : null;
}

function extractBodyHtml(html: string): string | null {
  const match = html.match(
    /<section class="jobtext-jobad__body">([\s\S]*?)<\/section>/i
  );
  return match?.[1] ?? null;
}

export const jobindexScraper: JobScraper = {
  provider: "jobindex",

  canHandle(url: URL): boolean {
    const host = url.hostname.replace(/^www\./, "");
    return (
      host === "jobindex.dk" &&
      /\/(?:jobannonce|vis-job)\/h\d+/i.test(url.pathname)
    );
  },

  async scrape(url: URL): Promise<ScrapedJob> {
    const normalized = normalizeJobindexUrl(url);

    let html: string;
    try {
      html = await fetchHtml(normalized.toString());
    } catch {
      throw new JobScrapeError(
        "Could not fetch job page from Jobindex.",
        "fetch_failed"
      );
    }

    if (/Siden kan ikke findes/i.test(html)) {
      throw new JobScrapeError("Job not found on Jobindex.", "not_found");
    }

    const title =
      extractTagText(html, "h1") ??
      extractTagText(html, "title")?.replace(/\s*\|\s*Jobindex.*$/i, "") ??
      null;

    const company = extractMetadataItem(html, "Virksomhed:");
    const location = extractMetadataItem(html, "Lokation:");
    const bodyHtml = extractBodyHtml(html);
    const body = bodyHtml ? htmlToPlainText(bodyHtml) : "";

    if (!title || body.length < 40) {
      throw new JobScrapeError(
        "Could not extract job content from Jobindex page. Try pasting the job text manually.",
        "parse_failed"
      );
    }

    const resolvedCompany = company ?? "Not detected";
    const resolvedLocation = location ?? "Not detected";

    return {
      sourceUrl: normalized.toString(),
      title,
      company: resolvedCompany,
      location: resolvedLocation,
      jobDescription: buildJobDescriptionText({
        title,
        company: resolvedCompany,
        location: resolvedLocation,
        body,
      }),
      provider: "jobindex",
    };
  },
};
