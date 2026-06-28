import { downloadBlob } from "@/lib/export/download";
import { computePdfImageYPositions } from "@/lib/export/pdfPageLayout";

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll(".cv-export-hide").forEach((node) => {
        node.remove();
      });
    },
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
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

  const blob = pdf.output("blob");
  downloadBlob(blob, filename);
}
