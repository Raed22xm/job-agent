import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  TabStopPosition,
  TabStopType,
  TextRun,
} from "docx";
import { CV_SECTION_LABELS, type CvLanguage } from "@/lib/cvLanguage";
import type { GeneratedCV, Language } from "@/types";
import { buildExportBasename, downloadBlob } from "@/lib/export/download";
import {
  addPdfSectionHeading,
  addPdfWrappedText,
  createA4PdfAsync,
  PDF_BODY_SIZE,
  PDF_LINE_MM,
  PDF_MARGIN_MM,
  ensurePdfSpace,
  pdfContentWidth,
} from "@/lib/export/textPdf";

const ACCENT = "52705A";
const PROFILE_FILL = "E7F1E8";

export interface CVExportMetadata {
  languages?: Language[];
  certifications?: string[];
}

export function formatLanguages(languages: Language[]): string {
  return languages
    .map(({ language, level }) => `${language} (${level})`)
    .join(" · ");
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { color: ACCENT, size: 6, style: BorderStyle.SINGLE },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 19,
        color: "33473A",
      }),
    ],
  });
}

function profileParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 180, after: 120 },
    indent: { left: 140, right: 100 },
    border: { left: { color: ACCENT, size: 18, style: BorderStyle.SINGLE } },
    shading: { type: ShadingType.CLEAR, fill: PROFILE_FILL },
    children: [new TextRun({ text, size: 21 })],
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
  title: string,
  language: CvLanguage = "english",
  metadata: CVExportMetadata = {}
): Promise<void> {
  const { header, summary, skills, experience, education, projects } = cv.sections;
  const labels = CV_SECTION_LABELS[language];
  const contactParts = [header.location, header.email, header.phone].filter(Boolean);
  const linkParts = [header.linkedin, header.portfolio].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: header.fullName,
          bold: true,
          size: 40,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [new TextRun({ text: contactParts.join(" · "), size: 20 })],
    }),
  ];

  if (linkParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
        children: [new TextRun({ text: linkParts.join(" · "), size: 20 })],
      })
    );
  }

  children.push(
    profileParagraph(`${labels.summary.toUpperCase()}\n${summary}`),
    sectionHeading(labels.skills),
    bodyParagraph(skills.join(" · "))
  );

  children.push(sectionHeading(labels.experience));
  for (const role of experience) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
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
    children.push(sectionHeading(labels.projects));
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

  children.push(sectionHeading(labels.education));
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

    if (edu.details && edu.details.length > 0) {
      for (const detail of edu.details) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: detail, size: 22 })],
          })
        );
      }
    }
  }

  if (metadata.certifications?.length) {
    children.push(sectionHeading(labels.certifications));
    for (const certification of metadata.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: certification, size: 22 })],
      }));
    }
  }

  if (metadata.languages?.length) {
    children.push(
      sectionHeading(labels.languages),
      bodyParagraph(
        formatLanguages(metadata.languages)
      )
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 850, right: 850, bottom: 850, left: 850 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const basename = buildExportBasename("cv", company, title);
  downloadBlob(blob, `${basename}.docx`);
}

/** Text-based PDF — small file size (Jobnet max 6 MB). */
export async function exportCVToPdf(
  cv: GeneratedCV,
  company: string,
  title: string,
  language: CvLanguage = "english",
  metadata: CVExportMetadata = {}
): Promise<void> {
  const pdf = await createA4PdfAsync();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pdfContentWidth(pdf);
  let y = PDF_MARGIN_MM;
  const labels = CV_SECTION_LABELS[language];

  const { header, summary, skills, experience, education, projects } = cv.sections;
  const contactParts = [header.location, header.email, header.phone].filter(Boolean);
  const linkParts = [header.linkedin, header.portfolio].filter(Boolean);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(header.fullName, PDF_MARGIN_MM, y);
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (contactParts.length > 0) {
    pdf.text(contactParts.join(" · "), PDF_MARGIN_MM, y);
    y += 4.5;
  }
  if (linkParts.length > 0) {
    pdf.setTextColor(60, 60, 60);
    pdf.text(linkParts.join(" · "), PDF_MARGIN_MM, y);
    pdf.setTextColor(0, 0, 0);
    y += 4.5;
  }
  pdf.setDrawColor(82, 112, 90);
  pdf.setLineWidth(0.6);
  pdf.line(PDF_MARGIN_MM, y, pageWidth - PDF_MARGIN_MM, y);
  y += 5;

  pdf.setFontSize(PDF_BODY_SIZE);

  const profileLines = pdf.splitTextToSize(summary, maxWidth - 8) as string[];
  const profileHeight = 9 + profileLines.length * PDF_LINE_MM;
  y = ensurePdfSpace(pdf, y, profileHeight);
  pdf.setFillColor(231, 241, 232);
  pdf.setDrawColor(82, 112, 90);
  pdf.setLineWidth(0.8);
  pdf.rect(PDF_MARGIN_MM, y, maxWidth, profileHeight, "F");
  pdf.line(PDF_MARGIN_MM, y, PDF_MARGIN_MM, y + profileHeight);
  pdf.setTextColor(51, 71, 58);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(labels.summary.toUpperCase(), PDF_MARGIN_MM + 4, y + 5);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(PDF_BODY_SIZE);
  profileLines.forEach((line, index) => {
    pdf.text(line, PDF_MARGIN_MM + 4, y + 10 + index * PDF_LINE_MM);
  });
  y += profileHeight + 3;

  y = addPdfSectionHeading(pdf, labels.skills, y, maxWidth);
  y = addPdfWrappedText(pdf, skills.join(" · "), PDF_MARGIN_MM, y, maxWidth);
  y += 2;

  y = addPdfSectionHeading(pdf, labels.experience, y, maxWidth);
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
    y = addPdfSectionHeading(pdf, labels.projects, y, maxWidth);
    for (const project of projects) {
      pdf.setFont("helvetica", "bold");
      y = addPdfWrappedText(pdf, project.name, PDF_MARGIN_MM, y, maxWidth);
      pdf.setFont("helvetica", "normal");
      y = addPdfWrappedText(pdf, project.description, PDF_MARGIN_MM, y, maxWidth);
      y += 1;
    }
  }

  y = addPdfSectionHeading(pdf, labels.education, y, maxWidth);
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
    if (edu.details && edu.details.length > 0) {
      for (const detail of edu.details) {
        y = addPdfWrappedText(pdf, `• ${detail}`, PDF_MARGIN_MM + 2, y, maxWidth - 2);
      }
    }
    y += PDF_LINE_MM * 0.5;
  }

  if (metadata.certifications?.length) {
    y = addPdfSectionHeading(pdf, labels.certifications, y, maxWidth);
    for (const certification of metadata.certifications) {
      y = addPdfWrappedText(
        pdf,
        `• ${certification}`,
        PDF_MARGIN_MM + 2,
        y,
        maxWidth - 2
      );
    }
    y += 2;
  }

  if (metadata.languages?.length) {
    y = addPdfSectionHeading(pdf, labels.languages, y, maxWidth);
    y = addPdfWrappedText(
      pdf,
      formatLanguages(metadata.languages),
      PDF_MARGIN_MM,
      y,
      maxWidth
    );
  }

  const blob = pdf.output("blob");
  const basename = buildExportBasename("cv", company, title);
  downloadBlob(blob, `${basename}.pdf`);
}
