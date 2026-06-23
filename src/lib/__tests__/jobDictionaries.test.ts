import { describe, expect, it } from "vitest";
import {
  expandTermAliases,
  isLanguageTerm,
  termAppearsInText,
  termsAreEquivalent,
} from "@/lib/jobDictionaries";
import { matchCV } from "@/lib/matchCV";
import type { MasterCV, ParsedJob } from "@/types";

describe("jobDictionaries aliases", () => {
  it("matches Danish and Dansk", () => {
    expect(termsAreEquivalent("Danish", "Dansk")).toBe(true);
    expect(termAppearsInText("Danish", "Modersmål dansk")).toBe(true);
  });

  it("matches English and Engelsk", () => {
    expect(termsAreEquivalent("English", "Engelsk")).toBe(true);
    expect(termAppearsInText("English", "forhandlingsniveau engelsk")).toBe(
      true
    );
  });

  it("matches REST API variants", () => {
    expect(expandTermAliases("REST APIs")).toEqual(
      expect.arrayContaining(["rest api", "restful"])
    );
  });

  it("identifies language terms", () => {
    expect(isLanguageTerm("Danish")).toBe(true);
    expect(isLanguageTerm("React")).toBe(false);
  });
});

describe("matchCV language aliases", () => {
  const cvWithLanguages: MasterCV = {
    personalInfo: {
      fullName: "Test User",
      email: "test@example.com",
      phone: "+45 00 00 00 00",
      location: "Copenhagen",
      summary: "Developer.",
    },
    skills: ["JavaScript", "React"],
    tools: ["Git"],
    experience: [],
    education: [],
    languages: [
      { language: "Dansk", level: "Modersmål" },
      { language: "Engelsk", level: "Forhandlingsniveau" },
    ],
  };

  const jobWithEnglishKeywords: ParsedJob = {
    title: "Frontend Developer",
    company: "Acme",
    location: "Copenhagen",
    responsibilities: [],
    requirements: ["Danish", "English"],
    skills: ["React", "JavaScript"],
    tools: [],
    atsKeywords: ["Danish", "English", "React"],
    rawText: "Danish and English required. React developer.",
  };

  it("does not flag Danish/English as missing when CV has Dansk/Engelsk", () => {
    const result = matchCV(jobWithEnglishKeywords, cvWithLanguages);

    expect(result.matchedKeywords).toEqual(
      expect.arrayContaining(["Danish", "English", "React"])
    );
    expect(result.missingKeywords).not.toEqual(
      expect.arrayContaining(["Danish", "English"])
    );
  });
});
