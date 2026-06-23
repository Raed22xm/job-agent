import { normalizeApplication } from "@/lib/normalizeStoredData";
import type { Application, ApplicationStatus } from "@/types";

const LEGACY_STORAGE_KEY = "job-agent-applications";

async function parseApplicationsResponse(response: Response): Promise<Application[]> {
  const data = (await response.json()) as {
    error?: string;
    applications?: Application[];
  };

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }

  return Array.isArray(data.applications) ? data.applications : [];
}

async function migrateLegacyLocalStorage(): Promise<Application[] | null> {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw?.trim()) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return null;
    }

    const applications = parsed
      .map(normalizeApplication)
      .filter((app): app is Application => app !== null);

    if (applications.length === 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return null;
    }

    const response = await fetch("/api/applications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applications }),
    });

    if (!response.ok) return null;

    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return await parseApplicationsResponse(response);
  } catch {
    return null;
  }
}

export async function getApplications(): Promise<Application[]> {
  const response = await fetch("/api/applications", { cache: "no-store" });
  const applications = await parseApplicationsResponse(response);

  if (applications.length === 0) {
    const migrated = await migrateLegacyLocalStorage();
    if (migrated) return migrated;
  }

  return applications;
}

export async function saveApplication(
  application: Application
): Promise<Application[]> {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application }),
  });

  return parseApplicationsResponse(response);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<Application[]> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? `Update failed (${response.status})`);
  }

  return getApplications();
}

export async function updateApplication(
  id: string,
  patch: Partial<
    Pick<
      Application,
      | "status"
      | "notes"
      | "deadline"
      | "cvVersion"
      | "coverLetterStatus"
      | "recruiterContact"
      | "appliedDate"
      | "followUpDate"
    >
  >
): Promise<Application[]> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? `Update failed (${response.status})`);
  }

  return getApplications();
}

export async function deleteApplication(id: string): Promise<Application[]> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return parseApplicationsResponse(response);
}

export async function exportApplicationsJson(): Promise<string> {
  const applications = await getApplications();
  return JSON.stringify(applications, null, 2);
}

export async function importApplicationsJson(json: string): Promise<Application[]> {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid tracker backup: expected a JSON array.");
  }

  const applications = parsed
    .map(normalizeApplication)
    .filter((app): app is Application => app !== null);

  if (parsed.length > 0 && applications.length === 0) {
    throw new Error(
      "Invalid tracker backup: no valid applications were found."
    );
  }

  const response = await fetch("/api/applications", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applications }),
  });

  return parseApplicationsResponse(response);
}

export function createApplicationId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
