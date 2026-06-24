import { access, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { normalizeApplication } from "@/lib/normalizeStoredData";
import type { Application, ApplicationStatus } from "@/types";

const RELATIVE_PATH = path.join("data", "applications.sqlite");
const LEGACY_RELATIVE_PATH = path.join("data", "applications.json");

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

function createDatabase(filePath: string): DatabaseSync {
  const db = new DatabaseSync(filePath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
  `);
  return db;
}

export function applicationsFilePath(workspaceRoot = process.cwd()): string {
  return path.join(workspaceRoot, RELATIVE_PATH);
}

export function legacyApplicationsFilePath(workspaceRoot = process.cwd()): string {
  return path.join(workspaceRoot, LEGACY_RELATIVE_PATH);
}

async function migrateLegacyJsonIfNeeded(
  workspaceRoot = process.cwd()
): Promise<void> {
  const sqlitePath = applicationsFilePath(workspaceRoot);
  const legacyPath = legacyApplicationsFilePath(workspaceRoot);

  try {
    await access(sqlitePath);
    return;
  } catch {
    // No sqlite database yet; continue with legacy migration check.
  }

  try {
    await access(legacyPath);
  } catch {
    return;
  }

  const raw = await readFile(legacyPath, "utf8");
  if (!raw.trim()) return;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const applications = normalizeApplications(parsed);
    if (applications.length === 0) {
      await writeApplicationsToDisk([], workspaceRoot);
      return;
    }

    await writeApplicationsToDisk(applications, workspaceRoot);
    await rm(legacyPath, { force: true });
  } catch {
    await writeApplicationsToDisk([], workspaceRoot);
    await rm(legacyPath, { force: true });
  }
}

function getDatabase(workspaceRoot = process.cwd()): DatabaseSync {
  const filePath = applicationsFilePath(workspaceRoot);
  return createDatabase(filePath);
}

export async function readApplicationsFromDisk(
  workspaceRoot = process.cwd()
): Promise<Application[]> {
  const filePath = applicationsFilePath(workspaceRoot);
  await mkdir(path.dirname(filePath), { recursive: true });
  await migrateLegacyJsonIfNeeded(workspaceRoot);

  const db = getDatabase(workspaceRoot);
  try {
    const rows = db
      .prepare("SELECT payload FROM applications ORDER BY id")
      .all() as Array<{ payload: string }>;
    const applications = rows.map((row) => {
      const parsed = JSON.parse(row.payload) as Application;
      return normalizeApplication(parsed);
    }).filter((app): app is Application => app !== null);

    return sortApplications(applications);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  } finally {
    db.close();
  }
}

export async function writeApplicationsToDisk(
  applications: Application[],
  workspaceRoot = process.cwd()
): Promise<void> {
  const filePath = applicationsFilePath(workspaceRoot);
  await mkdir(path.dirname(filePath), { recursive: true });

  const db = createDatabase(filePath);
  try {
    db.exec("BEGIN TRANSACTION;");
    db.exec("DELETE FROM applications;");
    const insert = db.prepare("INSERT INTO applications (id, payload) VALUES (?, ?)");
    for (const application of applications) {
      insert.run(application.id, JSON.stringify(application));
    }
    db.exec("COMMIT;");
  } finally {
    db.close();
  }
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
