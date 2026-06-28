import { describe, expect, it } from "vitest";
import {
  buildJobnetLogClipboardText,
  buildJobnetLogEntry,
  inferWorkingHours,
  mapApplicationStatusToJobnet,
  parseWorkplaceLocation,
} from "@/lib/jobnet/buildJobnetLogEntry";
import type { Application } from "@/types";

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    createdAt: "2026-06-28T10:00:00.000Z",
    updatedAt: "2026-06-28T10:00:00.000Z",
    status: "applied",
    company: "SYBO",
    jobTitle: "UI/UX Designer (Mid/Senior)",
    location: "Copenhagen · Hybrid",
    matchScore: 82,
    coverLetterStatus: "sent",
    appliedDate: "2026-06-28",
    link: "https://sybo.teamtailor.com/jobs/123",
    job: {
      title: "UI/UX Designer (Mid/Senior)",
      company: "SYBO",
      location: "Copenhagen · Hybrid",
      responsibilities: [],
      requirements: [],
      tools: [],
      skills: [],
      atsKeywords: [],
      rawText: "Full-time UI/UX role in Copenhagen",
      sourceUrl: "https://sybo.teamtailor.com/jobs/123",
    },
    match: {
      score: 82,
      matchedKeywords: ["Figma", "wireframes", "user flows"],
      missingKeywords: [],
      recommendedFocusAreas: [
        "Figma",
        "wireframes",
        "user flows",
        "prototyping",
      ],
      summary: "Strong match",
    },
    ...overrides,
  };
}

describe("buildJobnetLogEntry", () => {
  it("maps application status to Jobnet progress labels", () => {
    expect(mapApplicationStatusToJobnet("draft")).toBe("Ikke søgt");
    expect(mapApplicationStatusToJobnet("applied")).toBe("Søgt");
    expect(mapApplicationStatusToJobnet("interview")).toBe("Samtale");
  });

  it("parses Danish postcodes from location strings", () => {
    expect(parseWorkplaceLocation("Holmens Kanal 7, 3., 1060 København K")).toEqual({
      addressLine: "Holmens Kanal 7, 3.",
      postalCodeAndCity: "1060 København K",
      streetAddress: "Holmens Kanal 7, 3.",
      hasDanishPostcode: true,
    });
  });

  it("falls back to city-only address when postcode is missing", () => {
    expect(parseWorkplaceLocation("Copenhagen · Hybrid")).toEqual({
      addressLine: "Copenhagen",
      postalCodeAndCity: "Copenhagen",
      streetAddress: "",
      hasDanishPostcode: false,
    });
  });

  it("detects part-time roles", () => {
    expect(inferWorkingHours("Student developer", "Aarhus", "Deltid studiejob")).toBe(
      "Deltid"
    );
    expect(inferWorkingHours("Frontend developer", "Copenhagen", "Full-time")).toBe(
      "Fuldtid"
    );
  });

  it("builds Jobnet fields and Danish description text", () => {
    const entry = buildJobnetLogEntry(makeApplication(), {
      portfolioUrl: "https://readibrahim.netlify.app",
    });

    expect(entry.fields.find((f) => f.key === "progressStatus")?.value).toBe("Søgt");
    expect(entry.fields.find((f) => f.key === "appliedDate")?.value).toBe(
      "28-06-2026"
    );
    expect(entry.fields.find((f) => f.key === "company")?.value).toBe("SYBO");
    expect(entry.description).toContain("SYBO");
    expect(entry.description).toContain("https://readibrahim.netlify.app");
    expect(entry.description).toContain("Figma");
  });

  it("extracts recruiter contact fields from job posting text", () => {
    const entry = buildJobnetLogEntry(
      makeApplication({
        job: {
          ...makeApplication().job,
          rawText:
            "Kontaktperson: Anna Larsen. Ansøg til anna.larsen@sybo.dk eller ring +45 20 11 22 33.",
        },
      })
    );

    expect(entry.fields.find((f) => f.key === "contactName")?.value).toBe(
      "Anna Larsen"
    );
    expect(entry.fields.find((f) => f.key === "contactEmail")?.value).toBe(
      "anna.larsen@sybo.dk"
    );
    expect(entry.fields.find((f) => f.key === "contactPhone")?.value).toBe(
      "+45 20 11 22 33"
    );
  });

  it("extracts deadline and address from posting when tracker fields are empty", () => {
    const entry = buildJobnetLogEntry(
      makeApplication({
        location: "Copenhagen",
        job: {
          ...makeApplication().job,
          rawText:
            "Ansøgningsfrist: 01.08.2026. Kontor: Holmens Kanal 7, 1060 København K.",
        },
      })
    );

    expect(entry.fields.find((f) => f.key === "deadline")?.value).toBe(
      "01-08-2026"
    );
    expect(entry.fields.find((f) => f.key === "address")?.value).toContain(
      "Holmens Kanal"
    );
    expect(entry.fields.find((f) => f.key === "postalCodeAndCity")?.value).toBe(
      "1060 København K"
    );
  });

  it("flags missing postcode when only city is known", () => {
    const entry = buildJobnetLogEntry(makeApplication());
    expect(entry.missingRequired).toContain("Postnummer og by");
    expect(entry.missingRequired).not.toContain("Adresse");
  });

  it("formats clipboard text grouped by Jobnet sections", () => {
    const entry = buildJobnetLogEntry(makeApplication());
    const text = buildJobnetLogClipboardText(entry);
    expect(text).toContain("## Om jobbet");
    expect(text).toContain("Stilling eller arbejdsområde:");
    expect(text).toContain("## Om din jobsøgning");
  });
});
