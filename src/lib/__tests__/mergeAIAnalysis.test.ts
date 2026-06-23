import { describe, expect, it } from "vitest";
import type { AIJobEnhancement } from "@/lib/ai/analyzeJobWithAI";
import {
  mergeGeneratedCV,
  mergeMatchResult,
  mergeParsedJob,
  mergeSkillOrder,
} from "@/lib/ai/mergeAIAnalysis";
import { analyzeJobLocally } from "@/lib/analyzeJobLocal";
import { parseJob } from "@/lib/parseJob";
import type { MasterCV } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 00 00 00 00",
    location: "Copenhagen",
    summary: "Developer with React experience.",
  },
  skills: ["JavaScript", "React", "CSS"],
  tools: ["Git"],
  experience: [
    {
      id: "exp-1",
      company: "Test Corp",
      title: "Developer",
      location: "Copenhagen",
      startDate: "2023-01",
      endDate: "2024-01",
      bullets: ["Built React apps."],
    },
  ],
  education: [],
};

describe("mergeSkillOrder", () => {
  it("reorders skills using AI suggestion and appends missing master skills", () => {
    const result = mergeSkillOrder(
      ["JavaScript", "React", "CSS"],
      ["CSS", "React"]
    );
    expect(result).toEqual(["CSS", "React", "JavaScript"]);
  });

  it("ignores skills not in master CV", () => {
    const result = mergeSkillOrder(["JavaScript", "React"], ["Python", "React"]);
    expect(result).toEqual(["React", "JavaScript"]);
  });
});

describe("mergeParsedJob", () => {
  it("prefers AI fields when present and keeps rawText from input", () => {
    const heuristic = parseJob(
      "Developer\nAcme · Copenhagen\n\nRequirements:\n- React"
    );
    const ai = {
      title: "Senior Developer",
      company: "Acme A/S",
      location: "Copenhagen, Denmark",
      responsibilities: ["Build features"],
      requirements: ["React"],
      tools: ["Git"],
      skills: ["React"],
      atsKeywords: ["React", "TypeScript"],
    };

    const merged = mergeParsedJob(
      heuristic,
      ai,
      "full job text that is long enough to pass validation checks easily",
      "https://thehub.io/jobs/example"
    );

    expect(merged.title).toBe("Senior Developer");
    expect(merged.company).toBe("Acme A/S");
    expect(merged.sourceUrl).toBe("https://thehub.io/jobs/example");
    expect(merged.rawText).toContain("full job text");
  });
});

describe("mergeMatchResult", () => {
  it("uses AI narrative when provided", () => {
    const baseline = analyzeJobLocally(
      "Developer\nAcme · Remote\n\nRequirements:\n- React and JavaScript",
      undefined,
      TEST_CV
    );

    const merged = mergeMatchResult(
      baseline.match,
      "Strong React alignment from verified experience.",
      ["Highlight React projects"]
    );

    expect(merged.score).toBe(baseline.match.score);
    expect(merged.summary).toBe("Strong React alignment from verified experience.");
    expect(merged.recommendedFocusAreas).toEqual(["Highlight React projects"]);
  });
});

describe("mergeGeneratedCV", () => {
  it("keeps experience and education from master CV", () => {
    const baseline = analyzeJobLocally(
      "Developer\nAcme · Remote\n\nRequirements:\n- React",
      undefined,
      TEST_CV
    );

    const merged = mergeGeneratedCV(
      baseline.generatedCV,
      "Tailored summary for React role.",
      ["React", "JavaScript", "CSS"],
      TEST_CV
    );

    expect(merged.sections.summary).toBe("Tailored summary for React role.");
    expect(merged.sections.skills).toEqual(["React", "JavaScript", "CSS"]);
    expect(merged.sections.experience).toEqual(TEST_CV.experience);
    expect(merged.sections.education).toEqual(TEST_CV.education);
  });
});

describe("analyzeJobLocally", () => {
  it("returns complete analysis without AI", () => {
    const result = analyzeJobLocally(
      "Frontend Developer\nAcme · Copenhagen\n\nRequirements:\n- React and JavaScript",
      undefined,
      TEST_CV
    );

    expect(result.mode).toBe("local");
    expect(result.job.title).toBeTruthy();
    expect(result.match.score).toBeGreaterThanOrEqual(0);
    expect(result.generatedCV.sections.skills.length).toBeGreaterThan(0);
    expect(result.generatedCoverLetter.paragraphs.length).toBeGreaterThan(0);
    expect(result.validation.valid).toBe(true);
  });
});

describe("AIJobEnhancement shape", () => {
  it("accepts a minimal valid enhancement object", () => {
    const enhancement: AIJobEnhancement = {
      parsedJob: {
        title: "Developer",
        company: "Acme",
        location: "Copenhagen",
        responsibilities: [],
        requirements: ["React"],
        tools: [],
        skills: ["React"],
        atsKeywords: ["React"],
      },
      matchSummary: "Good fit.",
      recommendedFocusAreas: ["Highlight React"],
      cvSummary: "React developer.",
      skillOrder: ["React", "JavaScript"],
      coverLetter: {
        greeting: "Dear Hiring Manager,",
        paragraphs: ["Paragraph one."],
        closing: "Sincerely,",
        signature: "Test User",
      },
    };

    expect(enhancement.parsedJob.title).toBe("Developer");
  });
});
