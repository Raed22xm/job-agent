import { describe, expect, it } from "vitest";
import {
  applicationIdentity,
  buildDraftApplicationFromSession,
  findMatchingApplication,
  mergeApplicationWithSession,
  resolveJobnetSelection,
  SESSION_CURRENT_ID,
} from "@/lib/jobnet/sessionApplication";
import type { Application, ParsedJob } from "@/types";

const parsedJob: ParsedJob = {
  title: "Junior AI Engineer",
  company: "KIME",
  location: "Copenhagen",
  responsibilities: [],
  requirements: [],
  tools: [],
  skills: [],
  atsKeywords: [],
  rawText: "AI engineer role",
  sourceUrl: "https://kime.ai/jobs/1",
};

const savedApp: Application = {
  id: "saved-1",
  createdAt: "2026-06-27T10:00:00.000Z",
  updatedAt: "2026-06-27T10:00:00.000Z",
  status: "applied",
  company: "SYBO",
  jobTitle: "UI/UX Designer",
  location: "Copenhagen",
  matchScore: 70,
  coverLetterStatus: "none",
  job: {
    title: "UI/UX Designer",
    company: "SYBO",
    location: "Copenhagen",
    responsibilities: [],
    requirements: [],
    tools: [],
    skills: [],
    atsKeywords: [],
    rawText: "old sybo text",
  },
  match: {
    score: 70,
    matchedKeywords: ["Figma"],
    missingKeywords: [],
    recommendedFocusAreas: [],
    summary: "Old",
  },
};

describe("sessionApplication", () => {
  it("resolves selection to current session when a new job is analyzed", () => {
    const match = {
      score: 82,
      matchedKeywords: ["Python"],
      missingKeywords: [],
      recommendedFocusAreas: ["LLM"],
      summary: "New",
    };

    expect(
      resolveJobnetSelection([savedApp], parsedJob, match)
    ).toBe(SESSION_CURRENT_ID);
  });

  it("merges latest session data onto a matching saved application", () => {
    const kimeSaved: Application = {
      ...savedApp,
      id: "kime-1",
      company: "KIME",
      jobTitle: "Junior AI Engineer",
      job: parsedJob,
    };

    const match = {
      score: 90,
      matchedKeywords: ["Python", "LLM"],
      missingKeywords: [],
      recommendedFocusAreas: ["RAG"],
      summary: "Updated",
    };

    const merged = mergeApplicationWithSession(kimeSaved, parsedJob, match);
    expect(merged.id).toBe("kime-1");
    expect(merged.match.score).toBe(90);
    expect(merged.match.matchedKeywords).toContain("LLM");
    expect(merged.job.rawText).toBe("AI engineer role");
  });

  it("finds saved applications by company, title, and url", () => {
    const apps = [savedApp, { ...savedApp, id: "kime-1", job: parsedJob, company: "KIME", jobTitle: parsedJob.title }];
    expect(findMatchingApplication(apps, parsedJob)?.id).toBe("kime-1");
    expect(applicationIdentity(parsedJob)).toContain("kime");
  });

  it("builds a draft application from the active analyzer session", () => {
    const draft = buildDraftApplicationFromSession(parsedJob, {
      score: 80,
      matchedKeywords: [],
      missingKeywords: [],
      recommendedFocusAreas: [],
      summary: "Draft",
    });
    expect(draft.id).toBe(SESSION_CURRENT_ID);
    expect(draft.company).toBe("KIME");
  });
});
