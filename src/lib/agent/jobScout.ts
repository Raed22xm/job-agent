/**
 * Job Scout — fetches live job listings from:
 *   - RemoteOK       (free, no key, global remote)
 *   - Jobnet.dk      (free, Danish gov job portal, no key needed)
 *   - Jobindex.dk    (free RSS feed, Denmark's largest job board)
 *   - Adzuna DK      (free tier, requires API keys — searches Denmark)
 *   - Adzuna GB/other (optional, if ADZUNA_COUNTRY is set)
 * Results are normalised, deduplicated, and sorted by match score.
 */

export interface ScoutedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  tags: string[];
  postedAt: string;
  source: "remoteok" | "adzuna" | "jobnet" | "jobindex";
  matchScore?: number;
  description?: string;
}

// ─── RemoteOK ───────────────────────────────────────────────────────────────

interface RemoteOKJob {
  id: string;
  position: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  tags: string[];
  date: string;
  description?: string;
}

export async function fetchRemoteOKJobs(query: string): Promise<ScoutedJob[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "JobAgent/0.4 (personal job search tool)" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const data: unknown[] = await res.json();
    const jobs = data.filter((item): item is RemoteOKJob =>
      typeof item === "object" && item !== null && "position" in item && "company" in item
    );

    const q = query.toLowerCase();
    const matched = jobs.filter((j) => {
      const searchable = `${j.position} ${j.company} ${(j.tags ?? []).join(" ")}`.toLowerCase();
      return q.split(/\s+/).some((word) => searchable.includes(word));
    });

    return matched.slice(0, 20).map((j): ScoutedJob => ({
      id: `remoteok-${j.id}`,
      title: j.position,
      company: j.company,
      location: j.location || "Remote",
      salary:
        j.salary_min && j.salary_max
          ? `$${Math.round(j.salary_min / 1000)}k – $${Math.round(j.salary_max / 1000)}k`
          : undefined,
      url: j.url,
      tags: j.tags ?? [],
      postedAt: j.date,
      source: "remoteok",
      description: j.description?.slice(0, 400),
    }));
  } catch {
    return [];
  }
}

// ─── Jobnet.dk (Danish government job portal) ────────────────────────────────

interface JobnetHit {
  JobAdvertId: string;
  Heading: string;
  WorkplaceAddress?: { MunicipalityName?: string; RegionName?: string };
  EmployerName?: string;
  ApplicationDeadlineDate?: string;
  JobPositionPostingUrl?: string;
  DiscriminatorType?: string;
  PresentationHeaderDescription?: string;
}

interface JobnetResponse {
  JobPositionPostings?: JobnetHit[];
  TotalResultCount?: number;
}

export async function fetchJobnetJobs(query: string): Promise<ScoutedJob[]> {
  try {
    const params = new URLSearchParams({
      SearchString: query,
      MaxResultCount: "20",
      SortField: "CreationDate",
      SortOrder: "Descending",
    });

    const res = await fetch(
      `https://job.jobnet.dk/CV/FindWork/SearchPublicPositions?${params}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return [];

    const data: JobnetResponse = await res.json();
    const postings = data.JobPositionPostings ?? [];

    return postings.map((j): ScoutedJob => {
      const city =
        j.WorkplaceAddress?.MunicipalityName ??
        j.WorkplaceAddress?.RegionName ??
        "Danmark";

      return {
        id: `jobnet-${j.JobAdvertId}`,
        title: j.Heading,
        company: j.EmployerName ?? "Ukendt virksomhed",
        location: city,
        url:
          j.JobPositionPostingUrl ??
          `https://job.jobnet.dk/CV/FindWork/Details/${j.JobAdvertId}`,
        tags: ["Danmark", j.DiscriminatorType ?? ""].filter(Boolean),
        postedAt: j.ApplicationDeadlineDate ?? new Date().toISOString(),
        source: "jobnet",
        description: j.PresentationHeaderDescription?.slice(0, 400),
      };
    });
  } catch {
    return [];
  }
}

// ─── Jobindex.dk (RSS feed) ──────────────────────────────────────────────────

export async function fetchJobindexJobs(query: string): Promise<ScoutedJob[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const rssUrl = `https://www.jobindex.dk/jobsoegning.rss?q=${encodedQuery}&subid=0`;

    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "JobAgent/0.4 (personal job search tool)" },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

    return items.slice(0, 20).map((item, idx): ScoutedJob => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ??
        item.match(/<title>(.*?)<\/title>/))?.[1] ?? "Ukendt stilling";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
      const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ??
        item.match(/<description>(.*?)<\/description>/))?.[1]
        ?.replace(/<[^>]+>/g, "")
        .slice(0, 400) ?? "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

      // Parse "Title — Company — Location" pattern common in Jobindex RSS
      const parts = title.split(/\s+[–—-]\s+/);
      const jobTitle = parts[0]?.trim() ?? title;
      const company = parts[1]?.trim() ?? "Jobindex";
      const location = parts[2]?.trim() ?? "Danmark";

      return {
        id: `jobindex-${idx}-${Date.now()}`,
        title: jobTitle,
        company,
        location,
        url: link,
        tags: ["Danmark", "Jobindex"],
        postedAt: pubDate || new Date().toISOString(),
        source: "jobindex",
        description,
      };
    });
  } catch {
    return [];
  }
}

// ─── Adzuna (multi-country) ──────────────────────────────────────────────────

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  created: string;
  description: string;
  category: { label: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
}

export async function fetchAdzunaJobs(
  query: string,
  location = "remote",
  country = "gb"
): Promise<ScoutedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey) return [];

  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: "20",
      what: query,
      where: location,
      content_type: "application/json",
    });

    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) return [];

    const data: AdzunaResponse = await res.json();
    const currencySymbol = country === "dk" ? "DKK " : country === "us" ? "$" : "£";

    return (data.results ?? []).map((j): ScoutedJob => ({
      id: `adzuna-${country}-${j.id}`,
      title: j.title,
      company: j.company.display_name,
      location: j.location.display_name,
      salary:
        j.salary_min && j.salary_max
          ? `${currencySymbol}${Math.round(j.salary_min / 1000)}k – ${Math.round(j.salary_max / 1000)}k`
          : undefined,
      url: j.redirect_url,
      tags: [j.category.label, country.toUpperCase()].filter(Boolean),
      postedAt: j.created,
      source: "adzuna",
      description: j.description?.slice(0, 400),
    }));
  } catch {
    return [];
  }
}

// ─── Aggregator ──────────────────────────────────────────────────────────────

export async function searchJobs(
  query: string,
  location?: string,
  markets: ("remote" | "dk" | "global")[] = ["remote", "dk"]
): Promise<ScoutedJob[]> {
  const adzunaConfiguredCountry = process.env.ADZUNA_COUNTRY ?? "gb";

  const fetchers: Promise<ScoutedJob[]>[] = [];

  if (markets.includes("remote")) {
    fetchers.push(fetchRemoteOKJobs(query));
  }

  if (markets.includes("dk")) {
    // Always include free Danish sources
    fetchers.push(fetchJobnetJobs(query));
    fetchers.push(fetchJobindexJobs(query));
    // Adzuna DK if keys available
    fetchers.push(fetchAdzunaJobs(query, location ?? "Danmark", "dk"));
  }

  if (markets.includes("global") || !markets.includes("dk")) {
    fetchers.push(fetchAdzunaJobs(query, location ?? "remote", adzunaConfiguredCountry));
  }

  const results = await Promise.allSettled(fetchers);
  const all: ScoutedJob[] = results
    .filter((r): r is PromiseFulfilledResult<ScoutedJob[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Deduplicate by normalised title+company
  const seen = new Set<string>();
  const deduped: ScoutedJob[] = [];
  for (const job of all) {
    const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(job);
    }
  }

  return deduped.slice(0, 40);
}

export function buildSearchQuery(skills: string[], title?: string): string {
  const parts: string[] = [];
  if (title) parts.push(title);
  parts.push(...skills.slice(0, 4));
  return parts.join(" ");
}
