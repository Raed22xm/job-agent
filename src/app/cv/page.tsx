"use client";

import { useRef } from "react";
import Link from "next/link";
import CVPreview from "@/components/CVPreview";
import ExportButtons from "@/components/ExportButtons";
import { useJobAgent } from "@/context/JobAgentContext";
import { exportCVToDocx, exportCVToPdf } from "@/lib/export/exportCV";

export default function CVGeneratorPage() {
  const { generatedCV, parsedJob } = useJobAgent();
  const exportRef = useRef<HTMLElement>(null);

  if (!generatedCV || !parsedJob) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">CV Generator</h1>
        <p className="mt-2 text-sm text-slate-600">
          Analyze a job first to generate a tailored ATS-friendly CV preview.
        </p>
        <Link
          href="/analyzer"
          className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Go to Job Analyzer
        </Link>
      </div>
    );
  }

  const getExportElement = () => {
    if (!exportRef.current) {
      throw new Error("CV preview is not ready for export.");
    }
    return exportRef.current;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CV Generator</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tailored for {parsedJob.title} at {parsedJob.company}. Review before
            exporting — PDF matches the preview; DOCX is editable in Word.
          </p>
        </div>
        <ExportButtons
          onExportPdf={() =>
            exportCVToPdf(
              getExportElement(),
              parsedJob.company,
              parsedJob.title
            )
          }
          onExportDocx={() =>
            exportCVToDocx(generatedCV, parsedJob.company, parsedJob.title)
          }
        />
      </div>

      <CVPreview cv={generatedCV} exportRef={exportRef} />
    </div>
  );
}
