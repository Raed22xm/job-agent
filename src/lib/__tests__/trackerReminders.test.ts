import { describe, expect, it } from "vitest";
import {
  collectApplicationReminders,
  filterApplicationsDueThisWeek,
  isDueThisWeek,
} from "@/lib/trackerReminders";
import type { Application } from "@/types";

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    job: {
      title: "Developer",
      company: "Acme",
      location: "Copenhagen",
      responsibilities: [],
      requirements: [],
      tools: [],
      skills: [],
      atsKeywords: [],
      rawText: "x".repeat(40),
    },
    match: {
      score: 70,
      matchedKeywords: [],
      missingKeywords: [],
      recommendedFocusAreas: [],
      summary: "ok",
    },
    status: "applied",
    company: "Acme",
    jobTitle: "Developer",
    location: "Copenhagen",
    matchScore: 70,
    coverLetterStatus: "sent",
    ...overrides,
  };
}

describe("trackerReminders", () => {
  const now = new Date("2026-06-23T12:00:00.000Z");

  it("detects deadline due this week", () => {
    expect(isDueThisWeek("2026-06-25", now)).toBe(true);
    expect(isDueThisWeek("2026-07-15", now)).toBe(false);
  });

  it("collects deadline and follow-up reminders", () => {
    const apps = [
      makeApp({ id: "a1", deadline: "2026-06-24" }),
      makeApp({ id: "a2", followUpDate: "2026-06-22" }),
      makeApp({ id: "a3", deadline: "2026-08-01" }),
    ];

    const reminders = collectApplicationReminders(apps, now);
    expect(reminders).toHaveLength(2);
    expect(reminders.map((r) => r.application.id).sort()).toEqual(["a1", "a2"]);
  });

  it("filters applications due this week", () => {
    const apps = [
      makeApp({ id: "a1", deadline: "2026-06-24" }),
      makeApp({ id: "a2", deadline: "2026-08-01" }),
    ];

    expect(filterApplicationsDueThisWeek(apps, now).map((a) => a.id)).toEqual([
      "a1",
    ]);
  });
});
