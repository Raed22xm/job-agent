import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { saveApplicationOutputs } from "@/lib/job/saveApplicationOutputs";
import type { GeneratedCoverLetter, GeneratedCV } from "@/types";

const sampleCV: GeneratedCV = {
  sections: {
    header: {
      fullName: "Raed Ibrahim",
      email: "test@example.com",
      phone: "+45 00 00 00 00",
      location: "Kastrup",
      summary: "Junior developer.",
    },
    summary: "Junior developer.",
    skills: ["React"],
    experience: [],
    education: [],
  },
  atsNotes: ["Verified only."],
};

const sampleLetter: GeneratedCoverLetter = {
  greeting: "Dear Hiring Manager,",
  paragraphs: ["Paragraph one."],
  closing: "Sincerely,",
  signature: "Raed Ibrahim",
};

describe("saveApplicationOutputs", () => {
  it("writes CV and cover letter markdown files", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "job-agent-"));

    const paths = await saveApplicationOutputs(
      {
        company: "TV2",
        title: "Android Developer",
        generatedCV: sampleCV,
        generatedCoverLetter: sampleLetter,
      },
      tempRoot
    );

    expect(paths.cvPath).toMatch(/^data\/outputs\/cvs\/.+\.md$/);
    expect(paths.coverLetterPath).toMatch(/^data\/outputs\/cover-letters\/.+\.md$/);

    const cvContent = await readFile(path.join(tempRoot, paths.cvPath!), "utf8");
    expect(cvContent).toContain("Raed Ibrahim");
    expect(cvContent).toContain("React");

    const letterContent = await readFile(
      path.join(tempRoot, paths.coverLetterPath!),
      "utf8"
    );
    expect(letterContent).toContain("Dear Hiring Manager");
  });
});
