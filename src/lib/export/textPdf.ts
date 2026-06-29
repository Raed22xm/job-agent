import type { jsPDF } from "jspdf";

export const PDF_MARGIN_MM = 15;
export const PDF_BODY_SIZE = 10;
export const PDF_LINE_MM = 4.8;

export async function createA4PdfAsync() {
  const { jsPDF } = await import("jspdf");
  return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
}

export function pdfContentWidth(pdf: jsPDF): number {
  return pdf.internal.pageSize.getWidth() - PDF_MARGIN_MM * 2;
}

export function pdfPageBottom(pdf: jsPDF): number {
  return pdf.internal.pageSize.getHeight() - PDF_MARGIN_MM;
}

export function ensurePdfSpace(
  pdf: jsPDF,
  y: number,
  neededMm: number
): number {
  if (y + neededMm <= pdfPageBottom(pdf)) return y;
  pdf.addPage();
  return PDF_MARGIN_MM;
}

export function addPdfWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = PDF_LINE_MM
): number {
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    y = ensurePdfSpace(pdf, y, lineHeight);
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export function addPdfSectionHeading(
  pdf: jsPDF,
  title: string,
  y: number,
  maxWidth: number
): number {
  y = ensurePdfSpace(pdf, y, 10);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  y = addPdfWrappedText(pdf, title.toUpperCase(), PDF_MARGIN_MM, y, maxWidth, 4);
  pdf.setLineWidth(0.2);
  pdf.line(PDF_MARGIN_MM, y, PDF_MARGIN_MM + maxWidth, y);
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(PDF_BODY_SIZE);
  return y;
}
