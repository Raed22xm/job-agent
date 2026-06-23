import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportApplicationsJson,
  getApplications,
  importApplicationsJson,
  saveApplication,
} from "@/lib/storage";
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

function mockFetchRouter(initial: Application[] = []) {
  let store = [...initial];

  return vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;

    if (url.endsWith("/api/applications") && method === "GET") {
      return Response.json({ applications: store });
    }

    if (url.endsWith("/api/applications") && method === "POST") {
      const app = body.application as Application;
      store = store.filter((item) => item.id !== app.id);
      store.unshift(app);
      return Response.json({ applications: store, application: app });
    }

    if (url.endsWith("/api/applications") && method === "PUT") {
      store = body.applications as Application[];
      return Response.json({ applications: store });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  });
}

describe("tracker storage client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchRouter());
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads applications from the API", async () => {
    vi.stubGlobal("fetch", mockFetchRouter([sampleApplication]));

    const apps = await getApplications();
    expect(apps).toHaveLength(1);
    expect(apps[0].jobTitle).toBe("Junior Frontend Developer");
  });

  it("exports saved applications as formatted JSON", async () => {
    await saveApplication(sampleApplication);

    const exported = await exportApplicationsJson();
    expect(JSON.parse(exported)).toHaveLength(1);
    expect(exported).toContain("Junior Frontend Developer");
  });

  it("imports valid tracker backups via PUT", async () => {
    const imported = await importApplicationsJson(JSON.stringify([sampleApplication]));

    expect(imported).toHaveLength(1);
    expect(imported[0].jobTitle).toBe("Junior Frontend Developer");
  });

  it("rejects non-array tracker backups", async () => {
    await expect(
      importApplicationsJson(JSON.stringify({ app: sampleApplication }))
    ).rejects.toThrow("expected a JSON array");
  });

  it("rejects non-empty backups with no valid applications", async () => {
    await expect(
      importApplicationsJson(JSON.stringify([{ id: "broken" }]))
    ).rejects.toThrow("no valid applications");
  });
});
