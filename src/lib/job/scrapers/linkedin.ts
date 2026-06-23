import {
  buildJobDescriptionText,
  extractMetaContent,
  extractTagText,
  fetchHtml,
  htmlToPlainText,
  normalizeWhitespace,
} from "@/lib/job/scrapers/htmlUtils";
import { JobScrapeError, type JobScraper, type ScrapedJob } from "@/lib/job/scrapers/types";

function extractJsonLdJobPosting(html: string): {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
} | null {
  const blocks = html.match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi
  );

  if (!blocks) return null;

  for (const block of blocks) {
    const jsonText = block
      .replace(/<script type="application\/ld\+json">/i, "")
      .replace(/<\/script>/i, "")
      .trim();

    try {
      const data = JSON.parse(jsonText) as Record<string, unknown>;
      const items = Array.isArray(data["@graph"])
        ? (data["@graph"] as Record<string, unknown>[])
        : [data];

      const posting = items.find((item) => item["@type"] === "JobPosting") as
        | Record<string, unknown>
        | undefined;

      if (!posting) continue;

      const hiringOrganization = posting.hiringOrganization as
        | Record<string, unknown>
        | undefined;
      const jobLocation = posting.jobLocation as
        | Record<string, unknown>
        | Array<Record<string, unknown>>
        | undefined;

      let location = "";
      const locationEntry = Array.isArray(jobLocation)
        ? jobLocation[0]
        : jobLocation;
      const address = locationEntry?.address as Record<string, unknown> | undefined;
      if (address) {
        location = normalizeWhitespace(
          [
            address.addressLocality,
            address.addressRegion,
            address.addressCountry,
          ]
            .filter(Boolean)
            .join(", ")
        );
      }

      return {
        title:
          typeof posting.title === "string" ? posting.title : undefined,
        company:
          typeof hiringOrganization?.name === "string"
            ? hiringOrganization.name
            : undefined,
        location: location || undefined,
        description:
          typeof posting.description === "string"
            ? htmlToPlainText(posting.description)
            : undefined,
      };
    } catch {
      continue;
    }
  }

  return null;
}

function cleanLinkedInTitle(value: string): string {
  return value.replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
}

export const linkedInScraper: JobScraper = {
  provider: "linkedin",

  canHandle(url: URL): boolean {
    const host = url.hostname.replace(/^www\./, "");
    return (
      host.endsWith("linkedin.com") &&
      /\/jobs\/view\/\d+/i.test(url.pathname)
    );
  },

  async scrape(url: URL): Promise<ScrapedJob> {
    let html: string;
    try {
      html = await fetchHtml(url.toString());
    } catch {
      throw new JobScrapeError(
        "Could not fetch LinkedIn job page.",
        "fetch_failed"
      );
    }

    const blocked =
      /authwall|sign-in|login|Join LinkedIn|security verification/i.test(html) &&
      !extractJsonLdJobPosting(html);

    if (blocked) {
      throw new JobScrapeError(
        "LinkedIn blocked automated access. Paste the job description manually.",
        "blocked"
      );
    }

    const jsonLd = extractJsonLdJobPosting(html);
    const ogTitle = extractMetaContent(html, "og:title");
    const ogDescription = extractMetaContent(html, "og:description");
    const pageTitle = extractTagText(html, "title");

    const title =
      jsonLd?.title ??
      (ogTitle ? cleanLinkedInTitle(ogTitle) : null) ??
      (pageTitle ? cleanLinkedInTitle(pageTitle) : null);

    const body = jsonLd?.description ?? ogDescription ?? "";
    if (!title || body.length < 40) {
      throw new JobScrapeError(
        "LinkedIn did not expose enough job content. Paste the job description manually.",
        "blocked"
      );
    }

    const company = jsonLd?.company ?? "Not detected";
    const location = jsonLd?.location ?? "Not detected";

    return {
      sourceUrl: url.toString(),
      title,
      company,
      location,
      jobDescription: buildJobDescriptionText({
        title,
        company,
        location,
        body,
      }),
      provider: "linkedin",
      warning:
        "LinkedIn content may be partial. Review before applying.",
    };
  },
};
