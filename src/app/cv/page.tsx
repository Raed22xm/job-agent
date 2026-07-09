"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import ATSKeywordCoverage from "@/components/ATSKeywordCoverage";
import CVEditor from "@/components/CVEditor";
import CVFeedbackPanel from "@/components/CVFeedbackPanel";
import { type FeedbackItem } from "@/lib/cv/cvFeedback";
import CVImpactScore from "@/components/CVImpactScore";
import CVPreview from "@/components/CVPreview";
import CVValidationPanel from "@/components/CVValidationPanel";
import ExportButtons from "@/components/ExportButtons";
import PreSendReviewModal from "@/components/PreSendReviewModal";
import { useJobAgent } from "@/context/JobAgentContext";
import { scoreCVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";
import { languageToPersonaId } from "@/lib/cvLanguage";
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
    cvLanguage,
    setCvLanguage,
    updateGeneratedCV,
    resetGeneratedCV,
  } = useJobAgent();

  const exportRef = useRef<HTMLElement>(null);
  const [validation, setValidation] = useState<CVValidationResult | null>(null);
  const [cvMeta, setCVMeta] = useState<CVMeta>({ languages: [], certifications: [] });
  const [preSendOpen, setPreSendOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"pdf" | "docx" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  const personaId = languageToPersonaId(cvLanguage);

  // Fetch master CV metadata (languages + certifications) for active persona
  useEffect(() => {
    void fetch(`/api/cv-meta?personaId=${encodeURIComponent(personaId)}`)
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
  }, [personaId]);

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
      body: JSON.stringify({ generatedCV, personaId }),
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
  }, [generatedCV, personaId]);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!generatedCV || !parsedJob) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">CV Generator</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Analyze a job first to generate a tailored ATS-friendly CV preview.
        </p>
        <Link
          href="/analyzer"
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
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

  const handleExport = async (type: "pdf" | "docx") => {
    setExportError(null);
    setIsExporting(type);
    try {
      if (type === "pdf") {
        await exportCVToPdf(generatedCV, parsedJob.company, parsedJob.title, cvLanguage);
      } else {
        await exportCVToDocx(generatedCV, parsedJob.company, parsedJob.title, cvLanguage);
      }
      setPreSendOpen(false);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please try again."
      );
    } finally {
      setIsExporting(null);
    }
  };

  const handleApplyFix = async (item: FeedbackItem) => {
    if (!generatedCV || !parsedJob) return;
    setIsApplyingFix(true);
    try {
      const res = await fetch("/api/apply-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: generatedCV, job: parsedJob, feedbackItem: item }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to apply fix");
      }

      const updatedData = await res.json();
      
      const newCV = { ...generatedCV };
      if (updatedData.updatedSection === "summary" && updatedData.summary) {
        newCV.sections.summary = updatedData.summary;
      } else if (updatedData.updatedSection === "skills" && updatedData.skills) {
        newCV.sections.skills = updatedData.skills;
      } else if (updatedData.updatedSection === "experience" && updatedData.experience) {
        newCV.sections.experience = updatedData.experience;
      }
      
      updateGeneratedCV(newCV);
    } catch (err) {
      console.error("Failed to apply feedback fix:", err);
      alert(err instanceof Error ? err.message : "Failed to apply feedback fix");
    } finally {
      setIsApplyingFix(false);
    }
  };

  const handleLanguageChange = async (language: typeof cvLanguage) => {
    setLanguageError(null);
    setIsSwitchingLanguage(true);
    try {
      await setCvLanguage(language);
    } catch (err) {
      setLanguageError(
        err instanceof Error ? err.message : "Could not switch CV language."
      );
    } finally {
      setIsSwitchingLanguage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header + export buttons */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">CV Generator</h1>
            <LanguageToggle
              value={cvLanguage}
              onChange={(language) => void handleLanguageChange(language)}
              disabled={isSwitchingLanguage}
            />
          </div>
          {isSwitchingLanguage && (
            <p className="mt-2 text-sm text-foreground-secondary">
              Switching language…
            </p>
          )}
          {languageError && (
            <p className="mt-2 text-sm text-error">{languageError}</p>
          )}
          <p className="mt-1 text-sm text-foreground-secondary">
            Tailored for{" "}
            <span className="font-medium">{parsedJob.title}</span> at{" "}
            <span className="font-medium">{parsedJob.company}</span>. Edit
            summary, skills, and bullets, then export — PDF is text-based
            (under 1 MB, Jobnet-safe); DOCX is editable in Word.
          </p>
        </div>
        <ExportButtons
          mode="review-first"
          disabled={exportBlocked}
          disabledReason={
            !validation
              ? "Checking CV validation before export."
              : exportBlocked
              ? "Fix CV validation errors before exporting."
              : undefined
          }
          primaryLabel="Review & export"
          onExportPdf={() => setPreSendOpen(true)}
          onExportDocx={() => setPreSendOpen(true)}
        />
      </div>

      {/* ── Impact Score ──────────────────────────────────────────────────── */}
      <CVImpactScore cv={generatedCV} parsedJob={parsedJob} />

      {/* ── Validation issues ─────────────────────────────────────────────── */}
      {validation && <CVValidationPanel issues={validation.issues} />}
      {!validation && (
        <p className="text-sm font-medium text-foreground-secondary">
          Checking CV validation…
        </p>
      )}

      {/* ── ATS keyword coverage ──────────────────────────────────────────── */}
      {keywordCoverage && <ATSKeywordCoverage coverage={keywordCoverage} />}

      {/* ── Per-section feedback ──────────────────────────────────────────── */}
      <CVFeedbackPanel 
        cv={generatedCV} 
        onApplyFix={handleApplyFix}
        isApplying={isApplyingFix}
      />

      <PreSendReviewModal
        open={preSendOpen}
        cv={generatedCV}
        parsedJob={parsedJob}
        validation={validation}
        isExporting={isExporting}
        onClose={() => {
          setPreSendOpen(false);
          setExportError(null);
        }}
        onExport={(type) => void handleExport(type)}
        exportError={exportError}
      />

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
          language={cvLanguage}
        />
      </div>
    </div>
  );
}
