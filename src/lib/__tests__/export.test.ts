import { describe, expect, it } from "vitest";
import {
  buildExportBasename,
  sanitizeFilenamePart,
} from "@/lib/export/download";

describe("export filenames", () => {
  it("sanitizes company and role names", () => {
    expect(sanitizeFilenamePart("Bodil Energi", "company")).toBe("bodil-energi");
    expect(sanitizeFilenamePart("Junior Dev (Student)", "role")).toBe(
      "junior-dev-student"
    );
  });

  it("builds a stable export basename", () => {
    const basename = buildExportBasename(
      "cv",
      "Acme Corp",
      "Frontend Developer"
    );

    expect(basename).toMatch(/^cv-acme-corp-frontend-developer-\d{4}-\d{2}-\d{2}$/);
  });
});

describe("pdf page layout", () => {
  it("returns one position for content that fits a single page", async () => {
    const { computePdfImageYPositions } = await import(
      "@/lib/export/pdfPageLayout"
    );
    expect(computePdfImageYPositions(200, 297, 10)).toEqual([10]);
  });

  it("slices tall content across multiple pages without duplicate offsets", async () => {
    const { computePdfImageYPositions } = await import(
      "@/lib/export/pdfPageLayout"
    );
    const positions = computePdfImageYPositions(400, 297, 10);
    expect(positions.length).toBe(2);
    expect(positions[0]).toBe(10);
    expect(positions[1]).toBeLessThan(0);
    expect(positions[1]).not.toBe(positions[0]);
  });
});
