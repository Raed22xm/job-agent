"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import CVEditor from "@/components/CVEditor";
import CVPreview from "@/components/CVPreview";
import CVValidationPanel from "@/components/CVValidationPanel";
import ExportButtons from "@/components/ExportButtons";
import { useJobAgent } from "@/context/JobAgentContext";
import { validateGeneratedCV } from "@/lib/cv/validateCV";
import { exportCVToDocx, exportCVToPdf } from "@/lib/export/exportCV";
import { getMasterCV } from "@/lib/matchCV";

export default function CVGeneratorPage() {
  const {
    generatedCV,
    parsedJob,
    updateGeneratedCV,
    resetGeneratedCV,
  } = useJobAgent();
  const exportRef = useRef<HTMLElement>(null);

  const validation = useMemo(() => {
    if (!generatedCV) return null;
    return validateGeneratedCV(generatedCV, getMasterCV());
  }, [generatedCV]);

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

  const exportBlocked = validation ? !validation.valid : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CV Generator</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tailored for {parsedJob.title} at {parsedJob.company}. Edit summary,
            skills, and bullets, then export — PDF matches preview; DOCX is editable
            in Word.
          </p>
        </div>
        <ExportButtons
          disabled={exportBlocked}
          disabledReason={
            exportBlocked
              ? "Fix CV validation errors before exporting."
              : undefined
          }
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

      {validation && <CVValidationPanel issues={validation.issues} />}

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <CVEditor
          cv={generatedCV}
          onChange={updateGeneratedCV}
          onReset={resetGeneratedCV}
        />
        <CVPreview cv={generatedCV} exportRef={exportRef} />
      </div>
    </div>
  );
}
