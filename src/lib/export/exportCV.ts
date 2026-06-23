import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { GeneratedCV } from "@/types";
import { buildExportBasename, downloadBlob } from "@/lib/export/download";
import { exportElementToPdf } from "@/lib/export/exportElementToPdf";

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { color: "999999", size: 6, style: "single" },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 20,
      }),
    ],
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22 })],
  });
}

export async function exportCVToDocx(
  cv: GeneratedCV,
  company: string,
  title: string
): Promise<void> {
  const { header, summary, skills, experience, education, projects } = cv.sections;
  const contactParts = [header.location, header.email, header.phone].filter(Boolean);
  const linkParts = [header.linkedin, header.portfolio].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: header.fullName,
          bold: true,
          size: 32,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: contactParts.join(" · "), size: 20 })],
    }),
  ];

  if (linkParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: linkParts.join(" · "), size: 20 })],
      })
    );
  }

  children.push(
    sectionHeading("Professional Summary"),
    bodyParagraph(summary),
    sectionHeading("Skills"),
    bodyParagraph(skills.join(" · "))
  );

  children.push(sectionHeading("Experience"));
  for (const role of experience) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({ text: role.title, bold: true, size: 22 }),
          new TextRun({
            text: `\t${role.startDate} – ${role.endDate}`,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${role.company} · ${role.location}`,
            italics: true,
            size: 22,
          }),
        ],
      })
    );

    for (const bullet of role.bullets) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [new TextRun({ text: bullet, size: 22 })],
        })
      );
    }
  }

  if (projects && projects.length > 0) {
    children.push(sectionHeading("Projects"));
    for (const project of projects) {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: project.name, bold: true, size: 22 }),
          ],
        }),
        bodyParagraph(project.description)
      );
    }
  }

  children.push(sectionHeading("Education"));
  for (const edu of education) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: `${edu.degree} in ${edu.field}`,
            bold: true,
            size: 22,
          }),
        ],
      }),
      bodyParagraph(
        `${edu.institution} · ${edu.startDate} – ${edu.endDate}`
      )
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const basename = buildExportBasename("cv", company, title);
  downloadBlob(blob, `${basename}.docx`);
}

export async function exportCVToPdf(
  element: HTMLElement,
  company: string,
  title: string
): Promise<void> {
  const basename = buildExportBasename("cv", company, title);
  await exportElementToPdf(element, `${basename}.pdf`);
}
