import { Document, Packer, Paragraph, TextRun } from "docx";
import type { GeneratedCoverLetter } from "@/types";
import { buildExportBasename, downloadBlob } from "@/lib/export/download";
import {
  addPdfWrappedText,
  createA4PdfAsync,
  PDF_BODY_SIZE,
  PDF_MARGIN_MM,
  pdfContentWidth,
} from "@/lib/export/textPdf";

export async function exportCoverLetterToDocx(
  letter: GeneratedCoverLetter,
  company: string,
  title: string
): Promise<void> {
  const children = [
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: letter.greeting, size: 22 })],
    }),
    ...letter.paragraphs.map(
      (paragraph) =>
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun({ text: paragraph, size: 22 })],
        })
    ),
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: letter.closing, size: 22 })],
    }),
    new Paragraph({
      spacing: { before: 360 },
      children: [new TextRun({ text: letter.signature, bold: true, size: 22 })],
    }),
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const basename = buildExportBasename("cover-letter", company, title);
  downloadBlob(blob, `${basename}.docx`);
}

/** Text-based PDF — small file size (Jobnet max 6 MB). */
export async function exportCoverLetterToPdf(
  letter: GeneratedCoverLetter,
  company: string,
  title: string
): Promise<void> {
  const pdf = await createA4PdfAsync();
  const maxWidth = pdfContentWidth(pdf);
  let y = PDF_MARGIN_MM;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(PDF_BODY_SIZE);

  y = addPdfWrappedText(pdf, letter.greeting, PDF_MARGIN_MM, y, maxWidth);
  y += 4;

  for (const paragraph of letter.paragraphs) {
    y = addPdfWrappedText(pdf, paragraph, PDF_MARGIN_MM, y, maxWidth);
    y += 4;
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
