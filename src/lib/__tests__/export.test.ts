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
