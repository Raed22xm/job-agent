"use client";

import { useState } from "react";

interface ExportButtonsProps {
  onExportPdf: () => Promise<void> | void;
  onExportDocx: () => Promise<void> | void;
  disabled?: boolean;
  disabledReason?: string;
  primaryLabel?: string;
  /** Opens review step first (export happens in modal). Default: direct export. */
  mode?: "direct" | "review-first";
  helpText?: string;
}

export default function ExportButtons({
  onExportPdf,
  onExportDocx,
  disabled = false,
  disabledReason,
  primaryLabel = "Export DOCX",
  mode = "direct",
  helpText,
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
  const defaultHelp =
    mode === "review-first"
      ? "Compare your CV to best practices before you export and apply."
      : "DOCX is recommended for ATS submissions. PDF preview export is image-based and may not be fully ATS-readable.";

  if (mode === "review-first") {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="max-w-sm text-right text-xs text-slate-500">
          {helpText ?? defaultHelp}
        </p>
        {disabledReason && (
          <p className="max-w-sm text-right text-xs font-medium text-rose-600">
            {disabledReason}
          </p>
        )}
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => void onExportDocx()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {primaryLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="max-w-sm text-right text-xs text-slate-500">
        {helpText ?? defaultHelp}
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
          {isExporting === "docx" ? "Exporting DOCX…" : primaryLabel}
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
