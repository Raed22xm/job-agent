export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function sanitizeFilenamePart(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9æøåäöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || fallback;
}

export function buildExportBasename(
  prefix: string,
  company: string,
  title: string
): string {
  const date = new Date().toISOString().slice(0, 10);
  const companyPart = sanitizeFilenamePart(company, "company");
  const titlePart = sanitizeFilenamePart(title, "role");

  return `${prefix}-${companyPart}-${titlePart}-${date}`.replace(/-+/g, "-");
}
