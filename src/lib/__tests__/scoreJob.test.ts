import { describe, expect, it } from "vitest";
import { SCORE_WEIGHTS, scoreJob, scoreSummary } from "@/lib/job/scoreJob";
import type { MasterCV, ParsedJob } from "@/types";

const TEST_CV: MasterCV = {
  personalInfo: {
    fullName: "Test User",
    email: "test@example.com",
    phone: "+45 00 00 00 00",
    location: "Copenhagen, Denmark",
    summary: "Junior developer with React experience.",
  },
  skills: ["JavaScript", "React", "CSS"],
  tools: ["Git", "Figma"],
  experience: [
    {
      id: "exp-1",
      company: "Test Corp",
      title: "Student Developer",
      location: "Copenhagen",
      startDate: "2023-01",
      endDate: "2024-01",
      bullets: ["Built React dashboards and integrated APIs."],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Test University",
      degree: "BSc",
      field: "Computer Science",
      startDate: "2019",
      endDate: "2024",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Portfolio App",
      description: "React and CSS portfolio project with Git workflow.",
    },
  ],
  languages: [
    { language: "Dansk", level: "Modersmål" },
    { language: "Engelsk", level: "Forhandlingsniveau" },
  ],
};

const JUNIOR_JOB: ParsedJob = {
  title: "Junior Frontend Developer",
  company: "Acme",
  location: "Copenhagen, Denmark",
  responsibilities: ["Build React applications"],
  requirements: ["React", "JavaScript", "Git", "English"],
  skills: ["React", "JavaScript", "CSS"],
  tools: ["Git", "Figma"],
  atsKeywords: ["React", "JavaScript", "Git"],
  rawText:
    "Junior frontend developer in Copenhagen. React, JavaScript, Git. English required.",
};

describe("scoreJob categories", () => {
  it("uses weights that sum to 100", () => {
    const total = Object.values(SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBe(100);
  });

  it("returns an overall score between 0 and 100", () => {
    const breakdown = scoreJob(JUNIOR_JOB, TEST_CV);
    expect(breakdown.overall).toBeGreaterThanOrEqual(0);
    expect(breakdown.overall).toBeLessThanOrEqual(100);
  });

  it("scores location highly for Copenhagen roles", () => {
    const breakdown = scoreJob(JUNIOR_JOB, TEST_CV);
    expect(breakdown.location.score).toBe(100);
  });

  it("scores junior roles favorably for junior profiles", () => {
    const breakdown = scoreJob(JUNIOR_JOB, TEST_CV);
    expect(breakdown.juniorFriendliness.score).toBe(100);
  });
});

describe("scoreSummary", () => {
  it("returns strong messaging for high scores", () => {
    expect(scoreSummary(80)).toContain("Strong alignment");
  });

  it("returns limited messaging for low scores", () => {
    expect(scoreSummary(10)).toContain("Limited overlap");
  });
});
