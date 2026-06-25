/**
 * Job Scout — fetches live job listings from:
 *   - RemoteOK          (free, no key, global remote)
 *   - Jobnet API        (free, Danish gov REST API — no login needed)
 *   - Jobnet.dk portal  (public website deep-links — https://jobnet.dk)
 *   - Jobindex.dk       (free RSS feed, Denmark's largest job board)
 *   - DTU Career Hub    (JobTeaser — login required; smart deep-links)
 *   - Adzuna DK         (free tier, requires API keys — searches Denmark)
 *   - Adzuna GB/other   (optional, if ADZUNA_COUNTRY is set)
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
  source: "remoteok" | "adzuna" | "jobnet" | "jobnet-portal" | "jobindex" | "dtu";
  matchScore?: number;
  description?: string;
  requiresLogin?: boolean;  // true for sources that need authentication
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

// ─── DTU Career Hub (JobTeaser — login required) ────────────────────────────
// DTU Career Hub runs on JobTeaser which has no public API or RSS feed.
// Access requires a DTU student/alumni login. We generate smart deep-links
// that open pre-searched results directly in the DTU Career Hub portal,
// saving the user from navigating manually.

const DTU_BASE = "https://careerhub.dtu.dk/students/jobs";
const DTU_COMPANY_BASE = "https://careerhub.dtu.dk/students/companies";

/**
 * Returns curated DTU Career Hub deep-links for a given query.
 * These are not scraped listings but direct search URLs the user
 * clicks to find jobs after logging in with their DTU credentials.
 */
export function buildDTUCareerHubLinks(query: string): ScoutedJob[] {
  const terms = query.split(/\s+/).filter(Boolean).slice(0, 4);
  const searchParam = encodeURIComponent(terms.join(" "));

  // Build a handful of targeted deep-links covering common job types
  const links: Array<{ label: string; url: string; tags: string[] }> = [
    {
      label: `"${terms.join(" ")}" jobs`,
      url: `${DTU_BASE}?query=${searchParam}`,
      tags: ["DTU Career Hub", "Student", "Danmark"],
    },
    {
      label: "Student jobs & internships",
      url: `${DTU_BASE}?query=${searchParam}&jobTypes=student`,
      tags: ["DTU Career Hub", "Internship", "Student job"],
    },
    {
      label: "Full-time graduate positions",
      url: `${DTU_BASE}?query=${searchParam}&jobTypes=graduate`,
      tags: ["DTU Career Hub", "Graduate", "Full-time"],
    },
    {
      label: "All companies on DTU Career Hub",
      url: `${DTU_COMPANY_BASE}?query=${searchParam}`,
      tags: ["DTU Career Hub", "Companies", "Direct apply"],
    },
  ];

  return links.map((link, i): ScoutedJob => ({
    id: `dtu-${i}-${Date.now()}`,
    title: `DTU Career Hub — ${link.label}`,
    company: "DTU Career Hub (login required)",
    location: "Lyngby, Danmark",
    url: link.url,
    tags: link.tags,
    postedAt: new Date().toISOString(),
    source: "dtu",
    requiresLogin: true,
    description:
      "DTU Career Hub is powered by JobTeaser and requires your DTU student or alumni login. " +
      "Click to open pre-searched results directly in the portal.",
  }));
}

// ─── Jobnet.dk Public Portal (https://jobnet.dk) ─────────────────────────────
// jobnet.dk is Denmark's official public job portal run by STAR
// (Styrelsen for Arbejdsmarked og Rekruttering). No login required to browse
// jobs. The portal URL uses Danish query params for filtering.
// Note: job.jobnet.dk/CV/FindWork requires NemLog-in (different portal);
// the API at SearchPublicPositions is auth-free (see fetchJobnetJobs above).

const JOBNET_PUBLIC_BASE = "https://www.jobnet.dk/ledige-job";

/**
 * Builds public deep-links to https://www.jobnet.dk with pre-applied search
 * query and common filters. Anyone can open these — no login needed.
 */
export function buildJobnetPortalLinks(query: string): ScoutedJob[] {
  const encoded = encodeURIComponent(query);

  const links: Array<{ label: string; url: string; tags: string[] }> = [
    {
      label: `Search: "${query}"`,
      url: `${JOBNET_PUBLIC_BASE}?søgeord=${encoded}`,
      tags: ["Jobnet.dk", "Alle stillinger", "Danmark"],
    },
    {
      label: "Fuldtidsstillinger (Full-time)",
      url: `${JOBNET_PUBLIC_BASE}?søgeord=${encoded}&arbejdstid=Fuldtid`,
      tags: ["Jobnet.dk", "Fuldtid", "Full-time"],
    },
    {
      label: "Deltid / studiejob (Part-time)",
      url: `${JOBNET_PUBLIC_BASE}?søgeord=${encoded}&arbejdstid=Deltid`,
      tags: ["Jobnet.dk", "Deltid", "Studiejob"],
    },
    {
      label: "Nyeste opslag (Newest first)",
      url: `${JOBNET_PUBLIC_BASE}?søgeord=${encoded}&sortering=Dato`,
      tags: ["Jobnet.dk", "Nyeste", "Sorteret"],
    },
  ];

  return links.map((link, i): ScoutedJob => ({
    id: `jobnet-portal-${i}-${Date.now()}`,
    title: `Jobnet.dk — ${link.label}`,
    company: "Jobnet.dk (offentlig portal)",
    location: "Danmark",
    url: link.url,
    tags: link.tags,
    postedAt: new Date().toISOString(),
    source: "jobnet-portal",
    requiresLogin: false,
    description:
      "Danmarks officielle jobportal (STAR). Åben for alle — intet login påkrævet. " +
      "Klik for at se søgeresultater direkte på jobnet.dk.",
  }));
}

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
    fetchers.push(fetchJobnetJobs(query));               // Jobnet API (live results)
    fetchers.push(fetchJobindexJobs(query));             // Jobindex RSS
    // Adzuna DK if keys available
    fetchers.push(fetchAdzunaJobs(query, location ?? "Danmark", "dk"));
    // Portal deep-links (always included — public, no login)
    fetchers.push(Promise.resolve(buildJobnetPortalLinks(query)));
    // DTU Career Hub deep-links (requires DTU login)
    fetchers.push(Promise.resolve(buildDTUCareerHubLinks(query)));
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
