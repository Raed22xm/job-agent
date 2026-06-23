import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { normalizeApplication } from "@/lib/normalizeStoredData";
import type { Application, ApplicationStatus } from "@/types";

const RELATIVE_PATH = path.join("data", "applications.json");

function sortApplications(applications: Application[]): Application[] {
  return [...applications].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function normalizeApplications(parsed: unknown): Application[] {
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(normalizeApplication)
    .filter((app): app is Application => app !== null);
}

export function applicationsFilePath(workspaceRoot = process.cwd()): string {
  return path.join(workspaceRoot, RELATIVE_PATH);
}

export async function readApplicationsFromDisk(
  workspaceRoot = process.cwd()
): Promise<Application[]> {
  const filePath = applicationsFilePath(workspaceRoot);

  try {
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) return [];
    return sortApplications(normalizeApplications(JSON.parse(raw)));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }
    // Corrupt JSON — reset so the tracker API does not 500
    if (error instanceof SyntaxError) {
      await writeApplicationsToDisk([], workspaceRoot);
      return [];
    }
    throw error;
  }
}

export async function writeApplicationsToDisk(
  applications: Application[],
  workspaceRoot = process.cwd()
): Promise<void> {
  const filePath = applicationsFilePath(workspaceRoot);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(applications, null, 2), "utf8");
}

export async function upsertApplicationOnDisk(
  application: Application,
  workspaceRoot = process.cwd()
): Promise<Application[]> {
  const applications = await readApplicationsFromDisk(workspaceRoot);
  const index = applications.findIndex((item) => item.id === application.id);

  if (index >= 0) {
    applications[index] = application;
  } else {
    applications.unshift(application);
  }

  const sorted = sortApplications(applications);
  await writeApplicationsToDisk(sorted, workspaceRoot);
  return sorted;
}

export async function replaceApplicationsOnDisk(
  applications: Application[],
  workspaceRoot = process.cwd()
): Promise<Application[]> {
  const sorted = sortApplications(applications);
  await writeApplicationsToDisk(sorted, workspaceRoot);
  return sorted;
}

export async function patchApplicationOnDisk(
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
  >,
  workspaceRoot = process.cwd()
): Promise<Application | null> {
  const applications = await readApplicationsFromDisk(workspaceRoot);
  let updated: Application | null = null;

  const next = applications.map((app) => {
    if (app.id !== id) return app;
    updated = { ...app, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });

  if (!updated) return null;

  await writeApplicationsToDisk(sortApplications(next), workspaceRoot);
  return updated;
}

export async function updateApplicationStatusOnDisk(
  id: string,
  status: ApplicationStatus,
  workspaceRoot = process.cwd()
): Promise<Application | null> {
  return patchApplicationOnDisk(id, { status }, workspaceRoot);
}

export async function deleteApplicationOnDisk(
  id: string,
  workspaceRoot = process.cwd()
): Promise<Application[]> {
  const applications = await readApplicationsFromDisk(workspaceRoot);
  const filtered = applications.filter((app) => app.id !== id);
  await writeApplicationsToDisk(filtered, workspaceRoot);
  return filtered;
}
