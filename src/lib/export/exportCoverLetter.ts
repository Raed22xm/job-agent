import { Document, Packer, Paragraph, TextRun } from "docx";
import type { GeneratedCoverLetter } from "@/types";
import { buildExportBasename, downloadBlob } from "@/lib/export/download";
import { exportElementToPdf } from "@/lib/export/exportElementToPdf";

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

export async function exportCoverLetterToPdf(
  element: HTMLElement,
  company: string,
  title: string
): Promise<void> {
  const basename = buildExportBasename("cover-letter", company, title);
  await exportElementToPdf(element, `${basename}.pdf`);
}
