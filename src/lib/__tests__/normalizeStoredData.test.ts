import { describe, expect, it } from "vitest";
import {
  normalizeApplication,
  normalizeGeneratedCoverLetter,
  normalizeGeneratedCV,
  normalizeMatchResult,
  normalizeParsedJob,
  normalizeStringArray,
} from "../normalizeStoredData";

describe("normalizeStoredData", () => {
  describe("normalizeStringArray", () => {
    it("returns empty array for non-array inputs", () => {
      expect(normalizeStringArray(null)).toEqual([]);
      expect(normalizeStringArray(undefined)).toEqual([]);
      expect(normalizeStringArray("string")).toEqual([]);
      expect(normalizeStringArray(123)).toEqual([]);
    });

    it("filters out non-string items", () => {
      expect(normalizeStringArray(["a", 123, null, "b", true])).toEqual([
        "a",
        "b",
      ]);
    });
  });

  describe("normalizeParsedJob", () => {
    it("returns null for invalid or nullish inputs", () => {
      expect(normalizeParsedJob(null)).toBeNull();
      expect(normalizeParsedJob({})).toBeNull();
      expect(normalizeParsedJob("invalid")).toBeNull();
    });

    it("normalizes a valid job object", () => {
      const input = {
        title: "Frontend Dev",
        company: "Acme",
        location: "Copenhagen",
        skills: ["React", "TypeScript"],
        rawText: "Full job text",
      };
      const result = normalizeParsedJob(input);
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Frontend Dev");
      expect(result?.company).toBe("Acme");
      expect(result?.skills).toEqual(["React", "TypeScript"]);
      expect(result?.rawText).toBe("Full job text");
    });
  });

  describe("normalizeMatchResult", () => {
    it("returns null for non-object inputs", () => {
      expect(normalizeMatchResult(null)).toBeNull();
      expect(normalizeMatchResult(undefined)).toBeNull();
      expect(normalizeMatchResult("string")).toBeNull();
    });

    it("normalizes match result with default fallback fields", () => {
      const input = { score: 85, summary: "Good match" };
      const result = normalizeMatchResult(input);
      expect(result).not.toBeNull();
      expect(result?.score).toBe(85);
      expect(result?.summary).toBe("Good match");
      expect(result?.matchedKeywords).toEqual([]);
      expect(result?.missingKeywords).toEqual([]);
    });
  });

  describe("normalizeGeneratedCV", () => {
    it("returns null for invalid inputs", () => {
      expect(normalizeGeneratedCV(null)).toBeNull();
      expect(normalizeGeneratedCV({})).toBeNull();
    });

    it("normalizes a generated CV structure", () => {
      const input = {
        sections: {
          header: {
            fullName: "John Doe",
            email: "john@example.com",
            phone: "+4512345678",
            location: "Denmark",
            summary: "Experienced dev",
          },
          summary: "Summary text",
          skills: ["React", "Node"],
          experience: [
            {
              id: "1",
              company: "Tech Corp",
              title: "Dev",
              location: "CPH",
              startDate: "2020",
              endDate: "2023",
              bullets: ["Built app"],
            },
          ],
          education: [],
        },
        atsNotes: ["High impact"],
      };

      const result = normalizeGeneratedCV(input);
      expect(result).not.toBeNull();
      expect(result?.sections.header.fullName).toBe("John Doe");
      expect(result?.sections.skills).toEqual(["React", "Node"]);
      expect(result?.atsNotes).toEqual(["High impact"]);
    });
  });

  describe("normalizeGeneratedCoverLetter", () => {
    it("returns null for invalid inputs", () => {
      expect(normalizeGeneratedCoverLetter(null)).toBeNull();
      expect(normalizeGeneratedCoverLetter({})).toBeNull();
    });

    it("normalizes cover letter fields", () => {
      const input = {
        greeting: "Dear Hiring Manager",
        paragraphs: ["P1", "P2"],
        closing: "Sincerely",
        signature: "John Doe",
      };

      const result = normalizeGeneratedCoverLetter(input);
      expect(result).toEqual({
        greeting: "Dear Hiring Manager",
        paragraphs: ["P1", "P2"],
        closing: "Sincerely",
        signature: "John Doe",
      });
    });
  });

  describe("normalizeApplication", () => {
    it("returns null for invalid application", () => {
      expect(normalizeApplication(null)).toBeNull();
      expect(normalizeApplication({})).toBeNull();
    });

    it("normalizes application fields correctly", () => {
      const input = {
        id: "app-123",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        company: "Acme",
        jobTitle: "Developer",
        location: "Copenhagen",
        status: "applied",
        matchScore: 90,
        coverLetterStatus: "ready",
        job: { title: "Developer", company: "Acme", rawText: "Job text" },
        match: { score: 90, matchedKeywords: [], missingKeywords: [], recommendedFocusAreas: [], summary: "OK" },
      };

      const result = normalizeApplication(input);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("app-123");
      expect(result?.company).toBe("Acme");
      expect(result?.status).toBe("applied");
    });
  });
});
