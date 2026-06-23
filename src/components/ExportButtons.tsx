"use client";

import { useState } from "react";

interface ExportButtonsProps {
  onExportPdf: () => Promise<void>;
  onExportDocx: () => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}

export default function ExportButtons({
  onExportPdf,
  onExportDocx,
  disabled = false,
  disabledReason,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (type: "pdf" | "docx") => {
    setError(null);
    setIsExporting(type);

    try {
      if (type === "pdf") {
        await onExportPdf();
      } else {
        await onExportDocx();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Export failed. Please try again.";
      setError(message);
    } finally {
      setIsExporting(null);
    }
  };

  const isBusy = isExporting !== null;
  const isDisabled = disabled || isBusy;

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="max-w-sm text-right text-xs text-slate-500">
        DOCX is recommended for ATS submissions. PDF preview export is image-based
        and may not be fully ATS-readable.
      </p>
      {disabledReason && (
        <p className="max-w-sm text-right text-xs font-medium text-rose-600">
          {disabledReason}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => handleExport("pdf")}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting === "pdf" ? "Exporting PDF…" : "Export PDF"}
        </button>
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => handleExport("docx")}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting === "docx" ? "Exporting DOCX…" : "Export DOCX"}
        </button>
      </div>
      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
