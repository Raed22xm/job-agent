import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportApplicationsJson,
  importApplicationsJson,
  saveApplication,
} from "@/lib/storage";
import type { Application } from "@/types";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

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

describe("tracker storage import/export", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports saved applications as formatted JSON", () => {
    saveApplication(sampleApplication);

    const exported = exportApplicationsJson();
    expect(JSON.parse(exported)).toHaveLength(1);
    expect(exported).toContain("Junior Frontend Developer");
  });

  it("imports valid tracker backups", () => {
    const imported = importApplicationsJson(JSON.stringify([sampleApplication]));

    expect(imported).toHaveLength(1);
    expect(imported[0].jobTitle).toBe("Junior Frontend Developer");
  });

  it("rejects non-array tracker backups", () => {
    expect(() => importApplicationsJson(JSON.stringify({ app: sampleApplication }))).toThrow(
      "expected a JSON array"
    );
  });

  it("rejects non-empty backups with no valid applications", () => {
    expect(() => importApplicationsJson(JSON.stringify([{ id: "broken" }]))).toThrow(
      "no valid applications"
    );
  });
});
