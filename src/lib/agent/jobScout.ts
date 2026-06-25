/**
 * Job Scout — fetches live job listings from RemoteOK (free, no key)
 * and optionally Adzuna (free tier, requires API keys in .env).
 * Results are normalised to a common shape and deduplicated.
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
  source: "remoteok" | "adzuna";
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
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) return [];

    const data: unknown[] = await res.json();
    const jobs = data.filter((item): item is RemoteOKJob => {
      return (
        typeof item === "object" &&
        item !== null &&
        "position" in item &&
        "company" in item
      );
    });

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

// ─── Adzuna ─────────────────────────────────────────────────────────────────

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
  location = "remote"
): Promise<ScoutedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  const country = process.env.ADZUNA_COUNTRY ?? "gb";

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

    return (data.results ?? []).map((j): ScoutedJob => ({
      id: `adzuna-${j.id}`,
      title: j.title,
      company: j.company.display_name,
      location: j.location.display_name,
      salary:
        j.salary_min && j.salary_max
          ? `£${Math.round(j.salary_min / 1000)}k – £${Math.round(j.salary_max / 1000)}k`
          : undefined,
      url: j.redirect_url,
      tags: [j.category.label].filter(Boolean),
      postedAt: j.created,
      source: "adzuna",
      description: j.description?.slice(0, 400),
    }));
  } catch {
    return [];
  }
}

// ─── Aggregator ─────────────────────────────────────────────────────────────

export async function searchJobs(
  query: string,
  location?: string
): Promise<ScoutedJob[]> {
  const [remoteOK, adzuna] = await Promise.all([
    fetchRemoteOKJobs(query),
    fetchAdzunaJobs(query, location ?? "remote"),
  ]);

  // Deduplicate by normalised title+company
  const seen = new Set<string>();
  const all: ScoutedJob[] = [];

  for (const job of [...adzuna, ...remoteOK]) {
    const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      all.push(job);
    }
  }

  return all.slice(0, 30);
}

export function buildSearchQuery(skills: string[], title?: string): string {
  const parts: string[] = [];
  if (title) parts.push(title);
  parts.push(...skills.slice(0, 4));
  return parts.join(" ");
}
