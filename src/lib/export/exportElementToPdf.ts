import { downloadBlob } from "@/lib/export/download";
import { computePdfImageYPositions } from "@/lib/export/pdfPageLayout";

const JOBNET_MAX_BYTES = 5.5 * 1024 * 1024;

/** Fallback image PDF — compresses to stay under Jobnet's 6 MB limit. */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const scales = [1.25, 1.5, 1.75, 2];
  const qualities = [0.72, 0.78, 0.85, 0.92];

  let blob: Blob | null = null;

  outer: for (const scale of scales) {
    for (const quality of qualities) {
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll(".cv-export-hide").forEach((node) => {
            node.remove();
          });
          clonedDoc.querySelectorAll(".cv-document, .export-document").forEach((node) => {
            if (node instanceof HTMLElement) {
              node.style.color = "#111111";
              node.style.backgroundColor = "#ffffff";
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", quality);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      const yPositions = computePdfImageYPositions(
        contentHeight,
        pageHeight,
        margin
      );

      yPositions.forEach((y, index) => {
        if (index > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", margin, y, contentWidth, contentHeight);
      });

      const candidate = pdf.output("blob");
      if (candidate.size <= JOBNET_MAX_BYTES) {
        blob = candidate;
        break outer;
      }
      if (!blob || candidate.size < blob.size) {
        blob = candidate;
      }
    }
  }

  if (!blob) {
    throw new Error("Failed to generate PDF.");
  }

  downloadBlob(blob, filename);
}
