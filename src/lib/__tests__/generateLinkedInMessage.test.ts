import { describe, expect, it } from "vitest";
import { generateLinkedInMessage } from "@/lib/generateLinkedInMessage";
import type { MasterCV, ParsedJob } from "@/types";

const cv: MasterCV = {
  personalInfo: {
    fullName: "Raed Ibrahim",
    email: "test@example.com",
    phone: "+45 00 00 00 00",
    location: "Kastrup",
    summary: "Junior developer.",
  },
  skills: ["React", "Kotlin"],
  tools: ["Git"],
  experience: [
    {
      id: "exp-1",
      company: "BS Technologies",
      title: "Software Developer Intern",
      location: "",
      startDate: "2024",
      endDate: "Present",
      bullets: ["Built apps in React."],
    },
  ],
  education: [],
};

const job: ParsedJob = {
  title: "Android Developer",
  company: "TV2",
  location: "Copenhagen",
  responsibilities: [],
  requirements: [],
  tools: [],
  skills: ["Kotlin"],
  atsKeywords: ["Kotlin"],
  rawText: "Android role at TV2",
};

describe("generateLinkedInMessage", () => {
  it("uses verified CV facts only", () => {
    const draft = generateLinkedInMessage(cv, job, {
      score: 80,
      matchedKeywords: ["Kotlin", "React"],
      missingKeywords: [],
      recommendedFocusAreas: [],
      summary: "Good fit",
    });

    expect(draft.connectionNote).toContain("TV2");
    expect(draft.connectionNote).toContain("BS Technologies");
    expect(draft.inMail).toContain("Raed Ibrahim");
    expect(draft.connectionNote.toLowerCase()).not.toContain("invented");
  });
});
