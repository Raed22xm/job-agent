import { access, mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  deleteApplicationOnDisk,
  patchApplicationOnDisk,
  readApplicationsFromDisk,
  upsertApplicationOnDisk,
} from "@/lib/server/applicationsStore";
import type { Application } from "@/types";

const sampleApplication: Application = {
  id: "app-test",
  createdAt: "2026-06-23T00:00:00.000Z",
  updatedAt: "2026-06-23T00:00:00.000Z",
  job: {
    title: "Junior Frontend Developer",
    company: "Acme",
    location: "Copenhagen",
    responsibilities: [],
    requirements: [],
    tools: [],
    skills: ["React"],
    atsKeywords: ["React"],
    rawText: "Junior Frontend Developer at Acme in Copenhagen. React required.",
  },
  match: {
    score: 80,
    matchedKeywords: ["React"],
    missingKeywords: [],
    recommendedFocusAreas: [],
    summary: "Strong match.",
  },
  status: "draft",
  company: "Acme",
  jobTitle: "Junior Frontend Developer",
  location: "Copenhagen",
  matchScore: 80,
  coverLetterStatus: "draft",
};

describe("applicationsStore", () => {
  it("persists applications to disk", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "job-agent-apps-"));

    await upsertApplicationOnDisk(sampleApplication, tempRoot);
    const loaded = await readApplicationsFromDisk(tempRoot);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].jobTitle).toBe("Junior Frontend Developer");

    await expect(
      access(path.join(tempRoot, "data", "applications.sqlite"))
    ).resolves.toBeUndefined();
  });

  it("recovers from corrupt applications JSON", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "job-agent-apps-"));
    const filePath = path.join(tempRoot, "data", "applications.json");
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, "{not-json", "utf8");

    const loaded = await readApplicationsFromDisk(tempRoot);
    expect(loaded).toEqual([]);
  });

  it("migrates legacy JSON tracker data into sqlite", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "job-agent-apps-"));
    const legacyFilePath = path.join(tempRoot, "data", "applications.json");
    await mkdir(path.dirname(legacyFilePath), { recursive: true });
    await writeFile(legacyFilePath, JSON.stringify([sampleApplication]), "utf8");

    const loaded = await readApplicationsFromDisk(tempRoot);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].jobTitle).toBe("Junior Frontend Developer");
  });

  it("patches and deletes applications", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "job-agent-apps-"));
    await upsertApplicationOnDisk(sampleApplication, tempRoot);

    const patched = await patchApplicationOnDisk(
      sampleApplication.id,
      { status: "applied", notes: "Follow up Friday" },
      tempRoot
    );
    expect(patched?.status).toBe("applied");

    const remaining = await deleteApplicationOnDisk(sampleApplication.id, tempRoot);
    expect(remaining).toHaveLength(0);

    const file = await readFile(
      path.join(tempRoot, "data", "applications.sqlite"),
      "utf8"
    );
    expect(file).not.toContain("undefined");
  });
});
