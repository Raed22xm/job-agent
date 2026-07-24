import { describe, expect, it } from "vitest";
import {
  analyseCVFeedback,
  bulletImpactScore,
  hasWeakOpener,
  scoreBullet,
  summaryQualityScore,
} from "../cv/cvFeedback";
import type { GeneratedCV } from "@/types";

describe("cvFeedback", () => {
  describe("hasWeakOpener", () => {
    it("detects weak openers", () => {
      expect(hasWeakOpener("I am a developer")).toBe(true);
      expect(hasWeakOpener("Responsible for managing servers")).toBe(true);
      expect(hasWeakOpener("Duties included coding")).toBe(true);
      expect(hasWeakOpener("Helped with testing")).toBe(true);
      expect(hasWeakOpener("Worked on features")).toBe(true);
    });

    it("returns false for strong openers", () => {
      expect(hasWeakOpener("Architected scalable cloud backend")).toBe(false);
      expect(hasWeakOpener("Built React frontend for 10k users")).toBe(false);
    });
  });

  describe("scoreBullet", () => {
    it("scores bullet points based on verb, metric, length, and openers", () => {
      expect(scoreBullet("")).toBe(0);
      expect(scoreBullet("I am doing work")).toBeLessThan(50);
      const highImpact = scoreBullet(
        "Architected scalable cloud platform improving throughput by 40%"
      );
      expect(highImpact).toBeGreaterThanOrEqual(80);
    });
  });

  const mockCV: GeneratedCV = {
    sections: {
      header: {
        fullName: "Test Candidate",
        email: "test@example.com",
        phone: "+4512345678",
        location: "Copenhagen",
        summary: "Summary text",
      },
      summary:
        "Full-stack developer with 5 years of experience building web apps for 100k active users.",
      skills: ["React", "TypeScript", "Node.js"],
      experience: [
        {
          id: "1",
          company: "Acme",
          title: "Senior Developer",
          location: "CPH",
          startDate: "2021",
          endDate: "Present",
          bullets: [
            "Architected React dashboard improving load performance by 35%.",
            "Led team of 4 engineers to deliver core payment gateway.",
          ],
        },
      ],
      education: [],
    },
    atsNotes: [],
  };

  describe("bulletImpactScore", () => {
    it("calculates overall impact score across bullets", () => {
      const score = bulletImpactScore(mockCV);
      expect(score).toBeGreaterThan(60);
    });

    it("returns 0 if no experience bullets exist", () => {
      const emptyCV: GeneratedCV = {
        ...mockCV,
        sections: { ...mockCV.sections, experience: [] },
      };
      expect(bulletImpactScore(emptyCV)).toBe(0);
    });
  });

  describe("summaryQualityScore", () => {
    it("evaluates professional summary quality", () => {
      const score = summaryQualityScore(mockCV);
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it("returns 0 for empty summary", () => {
      const emptyCV: GeneratedCV = {
        ...mockCV,
        sections: { ...mockCV.sections, summary: "" },
      };
      expect(summaryQualityScore(emptyCV)).toBe(0);
    });
  });

  describe("analyseCVFeedback", () => {
    it("generates feedback items for CV sections", () => {
      const items = analyseCVFeedback(mockCV);
      expect(Array.isArray(items)).toBe(true);
    });
  });
});
