import { normalizeApplication } from "@/lib/normalizeStoredData";
import type { Application, ApplicationStatus } from "@/types";

const STORAGE_KEY = "job-agent-applications";

function readApplications(): Application[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    const applications = parsed
      .map(normalizeApplication)
      .filter((app): app is Application => app !== null);

    if (applications.length !== parsed.length) {
      writeApplications(applications);
    }

    return applications;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeApplications(applications: Application[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

export function getApplications(): Application[] {
  return readApplications().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveApplication(application: Application): Application[] {
  const applications = readApplications();
  const index = applications.findIndex((item) => item.id === application.id);

  if (index >= 0) {
    applications[index] = application;
  } else {
    applications.unshift(application);
  }

  writeApplications(applications);
  return applications;
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Application[] {
  const applications = readApplications();
  const updated = applications.map((app) =>
    app.id === id
      ? { ...app, status, updatedAt: new Date().toISOString() }
      : app
  );

  writeApplications(updated);
  return updated;
}

export function deleteApplication(id: string): Application[] {
  const filtered = readApplications().filter((app) => app.id !== id);
  writeApplications(filtered);
  return filtered;
}

export function createApplicationId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
