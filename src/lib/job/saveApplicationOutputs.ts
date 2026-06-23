import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildExportBasename } from "@/lib/export/download";
import type { GeneratedCoverLetter, GeneratedCV } from "@/types";

export function formatCVMarkdown(
  cv: GeneratedCV,
  company: string,
  title: string,
  savedAt = new Date()
): string {
  const date = savedAt.toISOString().slice(0, 10);
  const { header, summary, skills, experience, education, projects } = cv.sections;

  const lines: string[] = [
    `# CV — ${title} at ${company}`,
    "",
    `**Date saved:** ${date}`,
    "",
    "---",
    "",
    `## ${header.fullName}`,
    "",
    `${header.location} · ${header.email} · ${header.phone}`,
    "",
    "### Professional Summary",
    "",
    summary,
    "",
    "### Skills",
    "",
    skills.join(" · "),
    "",
    "### Experience",
    "",
  ];

  for (const role of experience) {
    lines.push(
      `**${role.title}** — ${role.company} · ${role.startDate} – ${role.endDate}`,
      ""
    );
    for (const bullet of role.bullets) {
      lines.push(`- ${bullet}`);
    }
    lines.push("");
  }

  if (projects && projects.length > 0) {
    lines.push("### Projects", "");
    for (const project of projects) {
      lines.push(`**${project.name}** — ${project.description}`, "");
    }
  }

  lines.push("### Education", "");
  for (const edu of education) {
    lines.push(
      `**${edu.degree} in ${edu.field}** — ${edu.institution} · ${edu.startDate} – ${edu.endDate}`,
      ""
    );
  }

  if (cv.atsNotes.length > 0) {
    lines.push("### ATS Notes", "");
    for (const note of cv.atsNotes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

export function formatCoverLetterMarkdown(
  letter: GeneratedCoverLetter,
  company: string,
  title: string,
  savedAt = new Date()
): string {
  const date = savedAt.toISOString().slice(0, 10);

  return `# Cover Letter — ${title} at ${company}

**Date saved:** ${date}

---

${letter.greeting}

${letter.paragraphs.join("\n\n")}

${letter.closing}

${letter.signature}
`;
}

export interface SavedApplicationOutputs {
  cvPath?: string;
  coverLetterPath?: string;
}

export async function saveApplicationOutputs(
  input: {
    company: string;
    title: string;
    generatedCV?: GeneratedCV | null;
    generatedCoverLetter?: GeneratedCoverLetter | null;
  },
  workspaceRoot = process.cwd()
): Promise<SavedApplicationOutputs> {
  const savedAt = new Date();
  const result: SavedApplicationOutputs = {};

  if (input.generatedCV) {
    const basename = buildExportBasename("cv", input.company, input.title);
    const relativePath = path.join("data", "outputs", "cvs", `${basename}.md`);
    const absolutePath = path.join(workspaceRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(
      absolutePath,
      formatCVMarkdown(input.generatedCV, input.company, input.title, savedAt),
      "utf8"
    );
    result.cvPath = relativePath;
  }

  if (input.generatedCoverLetter) {
    const letterBasename = buildExportBasename(
      "cover-letter",
      input.company,
      input.title
    );
    const relativePath = path.join(
      "data",
      "outputs",
      "cover-letters",
      `${letterBasename}.md`
    );
    const absolutePath = path.join(workspaceRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(
      absolutePath,
      formatCoverLetterMarkdown(
        input.generatedCoverLetter,
        input.company,
        input.title,
        savedAt
      ),
      "utf8"
    );
    result.coverLetterPath = relativePath;
  }

  return result;
}
