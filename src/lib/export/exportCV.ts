import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { GeneratedCV } from "@/types";
import { buildExportBasename, downloadBlob } from "@/lib/export/download";
import {
  addPdfSectionHeading,
  addPdfWrappedText,
  createA4PdfAsync,
  PDF_BODY_SIZE,
  PDF_LINE_MM,
  PDF_MARGIN_MM,
  pdfContentWidth,
} from "@/lib/export/textPdf";

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

/** Text-based PDF — small file size (Jobnet max 6 MB). */
export async function exportCVToPdf(
  cv: GeneratedCV,
  company: string,
  title: string
): Promise<void> {
  const pdf = await createA4PdfAsync();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pdfContentWidth(pdf);
  let y = PDF_MARGIN_MM;

  const { header, summary, skills, experience, education, projects } = cv.sections;
  const contactParts = [header.location, header.email, header.phone].filter(Boolean);
  const linkParts = [header.linkedin, header.portfolio].filter(Boolean);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(header.fullName, pageWidth / 2, y, { align: "center" });
  y += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (contactParts.length > 0) {
    pdf.text(contactParts.join(" · "), pageWidth / 2, y, { align: "center" });
    y += 4.5;
  }
  if (linkParts.length > 0) {
    pdf.setTextColor(60, 60, 60);
    pdf.text(linkParts.join(" · "), pageWidth / 2, y, { align: "center" });
    pdf.setTextColor(0, 0, 0);
    y += 4.5;
  }
  y += 4;

  pdf.setFontSize(PDF_BODY_SIZE);

  y = addPdfSectionHeading(pdf, "Professional Summary", y, maxWidth);
  y = addPdfWrappedText(pdf, summary, PDF_MARGIN_MM, y, maxWidth);
  y += 2;

  y = addPdfSectionHeading(pdf, "Skills", y, maxWidth);
  y = addPdfWrappedText(pdf, skills.join(" · "), PDF_MARGIN_MM, y, maxWidth);
  y += 2;

  y = addPdfSectionHeading(pdf, "Experience", y, maxWidth);
  for (const role of experience) {
    pdf.setFont("helvetica", "bold");
    y = addPdfWrappedText(
      pdf,
      `${role.title}  ·  ${role.startDate} – ${role.endDate}`,
      PDF_MARGIN_MM,
      y,
      maxWidth
    );
    pdf.setFont("helvetica", "italic");
    y = addPdfWrappedText(
      pdf,
      `${role.company} · ${role.location}`,
      PDF_MARGIN_MM,
      y,
      maxWidth
    );
    pdf.setFont("helvetica", "normal");
    for (const bullet of role.bullets) {
      y = addPdfWrappedText(pdf, `• ${bullet}`, PDF_MARGIN_MM + 2, y, maxWidth - 2);
    }
    y += 2;
  }

  if (projects && projects.length > 0) {
    y = addPdfSectionHeading(pdf, "Projects", y, maxWidth);
    for (const project of projects) {
      pdf.setFont("helvetica", "bold");
      y = addPdfWrappedText(pdf, project.name, PDF_MARGIN_MM, y, maxWidth);
      pdf.setFont("helvetica", "normal");
      y = addPdfWrappedText(pdf, project.description, PDF_MARGIN_MM, y, maxWidth);
      y += 1;
    }
  }

  y = addPdfSectionHeading(pdf, "Education", y, maxWidth);
  for (const edu of education) {
    pdf.setFont("helvetica", "bold");
    y = addPdfWrappedText(
      pdf,
      `${edu.degree} in ${edu.field}`,
      PDF_MARGIN_MM,
      y,
      maxWidth
    );
    pdf.setFont("helvetica", "normal");
    y = addPdfWrappedText(
      pdf,
      `${edu.institution} · ${edu.startDate} – ${edu.endDate}`,
      PDF_MARGIN_MM,
      y,
      maxWidth
    );
    y += PDF_LINE_MM * 0.5;
  }

  const blob = pdf.output("blob");
  const basename = buildExportBasename("cv", company, title);
  downloadBlob(blob, `${basename}.pdf`);
}
