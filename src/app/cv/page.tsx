"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ATSKeywordCoverage from "@/components/ATSKeywordCoverage";
import CVEditor from "@/components/CVEditor";
import CVFeedbackPanel from "@/components/CVFeedbackPanel";
import CVImpactScore from "@/components/CVImpactScore";
import CVPreview from "@/components/CVPreview";
import CVValidationPanel from "@/components/CVValidationPanel";
import ExportButtons from "@/components/ExportButtons";
import { useJobAgent } from "@/context/JobAgentContext";
import { scoreCVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";
import { exportCVToDocx, exportCVToPdf } from "@/lib/export/exportCV";
import type { CVValidationResult, Language } from "@/types";

interface CVMeta {
  languages: Language[];
  certifications: string[];
}

export default function CVGeneratorPage() {
  const {
    generatedCV,
    parsedJob,
    updateGeneratedCV,
    resetGeneratedCV,
  } = useJobAgent();

  const exportRef = useRef<HTMLElement>(null);
  const [validation, setValidation] = useState<CVValidationResult | null>(null);
  const [cvMeta, setCVMeta] = useState<CVMeta>({ languages: [], certifications: [] });

  // Fetch master CV metadata (languages + certifications) once on mount
  useEffect(() => {
    void fetch("/api/cv-meta")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (
          data &&
          typeof data === "object" &&
          "languages" in data &&
          "certifications" in data
        ) {
          setCVMeta(data as CVMeta);
        }
      })
      .catch(() => {/* non-critical — preview still works without */});
  }, []);

  // ATS keyword coverage (memoised)
  const keywordCoverage = useMemo(() => {
    if (!generatedCV || !parsedJob) return null;
    return scoreCVKeywordCoverage(generatedCV, parsedJob);
  }, [generatedCV, parsedJob]);

  // Validation: re-run whenever CV changes
  useEffect(() => {
    if (!generatedCV) {
      setValidation(null);
      return;
    }

    const controller = new AbortController();
    setValidation(null);

    void fetch("/api/validate-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedCV }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          validation?: CVValidationResult;
        };

        if (!response.ok || !data.validation) {
          throw new Error(data.error ?? `Validation failed (${response.status})`);
        }

        setValidation(data.validation);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setValidation({
          valid: false,
          issues: [
            {
              field: "validation",
              message:
                error instanceof Error
                  ? error.message
                  : "Could not validate CV before export.",
              severity: "error",
            },
          ],
        });
      });

    return () => controller.abort();
  }, [generatedCV]);

  // ── Empty state ────────────────────────────────────────────────────────────
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

  const exportBlocked = !validation || !validation.valid;

  return (
    <div className="space-y-6">
      {/* Page header + export buttons */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CV Generator</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tailored for{" "}
            <span className="font-medium">{parsedJob.title}</span> at{" "}
            <span className="font-medium">{parsedJob.company}</span>. Edit
            summary, skills, and bullets, then export — PDF matches preview;
            DOCX is editable in Word.
          </p>
        </div>
        <ExportButtons
          disabled={exportBlocked}
          disabledReason={
            !validation
              ? "Checking CV validation before export."
              : exportBlocked
              ? "Fix CV validation errors before exporting."
              : undefined
          }
          onExportPdf={() =>
            exportCVToPdf(getExportElement(), parsedJob.company, parsedJob.title)
          }
          onExportDocx={() =>
            exportCVToDocx(generatedCV, parsedJob.company, parsedJob.title)
          }
        />
      </div>

      {/* ── Impact Score ──────────────────────────────────────────────────── */}
      <CVImpactScore cv={generatedCV} parsedJob={parsedJob} />

      {/* ── Validation issues ─────────────────────────────────────────────── */}
      {validation && <CVValidationPanel issues={validation.issues} />}
      {!validation && (
        <p className="text-sm font-medium text-slate-500">
          Checking CV validation…
        </p>
      )}

      {/* ── ATS keyword coverage ──────────────────────────────────────────── */}
      {keywordCoverage && <ATSKeywordCoverage coverage={keywordCoverage} />}

      {/* ── Per-section feedback ──────────────────────────────────────────── */}
      <CVFeedbackPanel cv={generatedCV} />

      {/* ── Editor + Preview split ────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <CVEditor
          cv={generatedCV}
          onChange={updateGeneratedCV}
          onReset={resetGeneratedCV}
        />
        <CVPreview
          cv={generatedCV}
          exportRef={exportRef}
          languages={cvMeta.languages}
          certifications={cvMeta.certifications}
        />
      </div>
    </div>
  );
}
