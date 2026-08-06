import { BorderStyle, Document, Packer, Paragraph, TextRun } from "docx";
import {
  COVER_LETTER_LABELS,
  coverLetterHeadline,
  type CvLanguage,
} from "@/lib/cvLanguage";
import type { GeneratedCoverLetter, PersonalInfo } from "@/types";
import { buildExportBasename, downloadBlob } from "@/lib/export/download";
import {
  addPdfWrappedText,
  createA4PdfAsync,
  PDF_MARGIN_MM,
  pdfContentWidth,
} from "@/lib/export/textPdf";

export interface CoverLetterExportOptions {
  applicant?: PersonalInfo;
  language?: CvLanguage;
}

export async function exportCoverLetterToDocx(
  letter: GeneratedCoverLetter,
  company: string,
  title: string,
  options: CoverLetterExportOptions = {}
): Promise<void> {
  const language = options.language ?? "english";
  const labels = COVER_LETTER_LABELS[language];
  const contact = options.applicant
    ? [options.applicant.location, options.applicant.email, options.applicant.phone]
        .filter(Boolean)
        .join(" · ")
    : "";
  const links = options.applicant
    ? [options.applicant.linkedin, options.applicant.portfolio].filter(Boolean).join(" · ")
    : "";
  const children: Paragraph[] = [];

  if (options.applicant?.fullName) {
    children.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: options.applicant.fullName, bold: true, size: 26 })],
    }));
  }
  if (contact) {
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: contact, size: 18, color: "4B5563" })],
    }));
  }
  if (links) {
    children.push(new Paragraph({
      spacing: { after: 100 },
      border: { bottom: { color: "52705A", size: 10, style: BorderStyle.SINGLE } },
      children: [new TextRun({ text: links, size: 18, color: "4B5563" })],
    }));
  } else {
    children.push(new Paragraph({
      spacing: { after: 100 },
      border: { bottom: { color: "52705A", size: 10, style: BorderStyle.SINGLE } },
    }));
  }

  children.push(
    new Paragraph({
      spacing: { before: 180, after: 220 },
      children: [
        new TextRun({
          text: coverLetterHeadline(company, title, language),
          bold: true,
          size: 30,
          color: "33473A",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 180 },
      children: [new TextRun({ text: letter.greeting, size: 21 })],
    }),
  );

  letter.paragraphs.forEach((paragraph, index) => {
    if (index < 2) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [new TextRun({
          text: (index === 0 ? labels.motivation : labels.evidence).toUpperCase(),
          bold: true,
          size: 18,
          color: "52705A",
        })],
      }));
    }
    children.push(new Paragraph({
      spacing: { after: 180 },
      children: [new TextRun({ text: paragraph, size: 21 })],
    }));
  });

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 100 },
      children: [new TextRun({ text: letter.closing, size: 21 })],
    }),
    new Paragraph({
      spacing: { before: 240 },
      children: [new TextRun({ text: letter.signature, bold: true, size: 21 })],
    })
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 21 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1020, right: 1020, bottom: 1020, left: 1020 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const basename = buildExportBasename("cover-letter", company, title);
  downloadBlob(blob, `${basename}.docx`);
}

/** Text-based PDF — small file size (Jobnet max 6 MB). */
export async function exportCoverLetterToPdf(
  letter: GeneratedCoverLetter,
  company: string,
  title: string,
  options: CoverLetterExportOptions = {}
): Promise<void> {
  const pdf = await createA4PdfAsync();
  const maxWidth = pdfContentWidth(pdf);
  let y = PDF_MARGIN_MM;
  const language = options.language ?? "english";
  const labels = COVER_LETTER_LABELS[language];
  const contact = options.applicant
    ? [options.applicant.location, options.applicant.email, options.applicant.phone]
        .filter(Boolean)
        .join(" · ")
    : "";
  const links = options.applicant
    ? [options.applicant.linkedin, options.applicant.portfolio].filter(Boolean).join(" · ")
    : "";

  if (options.applicant?.fullName) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    y = addPdfWrappedText(pdf, options.applicant.fullName, PDF_MARGIN_MM, y, maxWidth, 5);
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  if (contact) y = addPdfWrappedText(pdf, contact, PDF_MARGIN_MM, y, maxWidth, 4);
  if (links) y = addPdfWrappedText(pdf, links, PDF_MARGIN_MM, y, maxWidth, 4);
  pdf.setDrawColor(82, 112, 90);
  pdf.setLineWidth(0.6);
  pdf.line(PDF_MARGIN_MM, y + 1, PDF_MARGIN_MM + maxWidth, y + 1);
  y += 8;

  pdf.setTextColor(51, 71, 58);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  y = addPdfWrappedText(
    pdf,
    coverLetterHeadline(company, title, language),
    PDF_MARGIN_MM,
    y,
    maxWidth,
    6
  );
  pdf.setTextColor(0, 0, 0);
  y += 4;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);

  y = addPdfWrappedText(pdf, letter.greeting, PDF_MARGIN_MM, y, maxWidth);
  y += 4;

  for (const [index, paragraph] of letter.paragraphs.entries()) {
    if (index < 2) {
      pdf.setTextColor(82, 112, 90);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      y = addPdfWrappedText(
        pdf,
        (index === 0 ? labels.motivation : labels.evidence).toUpperCase(),
        PDF_MARGIN_MM,
        y,
        maxWidth,
        4
      );
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
    }
    y = addPdfWrappedText(pdf, paragraph, PDF_MARGIN_MM, y, maxWidth);
    y += 3;
  }

  y += 2;
  y = addPdfWrappedText(pdf, letter.closing, PDF_MARGIN_MM, y, maxWidth);
  y += 8;
  pdf.setFont("helvetica", "bold");
  y = addPdfWrappedText(pdf, letter.signature, PDF_MARGIN_MM, y, maxWidth);

  const blob = pdf.output("blob");
  const basename = buildExportBasename("cover-letter", company, title);
  downloadBlob(blob, `${basename}.pdf`);
}
