"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import CoverLetterEditor from "@/components/CoverLetterEditor";
import CoverLetterPreview from "@/components/CoverLetterPreview";
import ExportButtons from "@/components/ExportButtons";
import { useJobAgent } from "@/context/JobAgentContext";
import {
  exportCoverLetterToDocx,
  exportCoverLetterToPdf,
} from "@/lib/export/exportCoverLetter";
import { saveApplication, updateApplication } from "@/lib/storage";
import type { Application, CVValidationResult } from "@/types";

export default function CoverLetterPage() {
  const {
    generatedCoverLetter,
    generatedCV,
    parsedJob,
    cvLanguage,
    setCvLanguage,
    updateGeneratedCoverLetter,
    resetGeneratedCoverLetter,
    applications,
    refreshApplications,
  } = useJobAgent();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [validation, setValidation] = useState<CVValidationResult | null>(null);

  useEffect(() => {
    if (!generatedCoverLetter || !parsedJob) {
      setValidation(null);
      return;
    }

    const controller = new AbortController();
    setValidation(null);
    void fetch("/api/validate-cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generatedCoverLetter,
        job: parsedJob,
        personaId: cvLanguage,
      }),
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
          issues: [{
            field: "validation",
            message:
              error instanceof Error
                ? error.message
                : "Could not validate cover letter before export.",
            severity: "error",
          }],
        });
      });

    return () => controller.abort();
  }, [generatedCoverLetter, parsedJob, cvLanguage]);

  if (!generatedCoverLetter || !parsedJob) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <h1 className="text-xl font-semibold text-foreground">Cover Letter</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Analyze a job first to generate a cover letter draft for review.
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

  const handleExportComplete = async () => {
    if (!parsedJob) return;
    
    // Check if application exists in tracker
    const existingApp = applications.find(
      (a) => a.jobTitle === parsedJob.title && a.company === parsedJob.company
    );

    try {
      if (existingApp) {
        await updateApplication(existingApp.id, { coverLetterStatus: "ready" });
        setSaveMessage("Cover letter status updated in tracker ✓");
      } else {
        const app: Partial<Application> = {
          id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          company: parsedJob.company,
          jobTitle: parsedJob.title,
          location: parsedJob.location,
          link: parsedJob.sourceUrl || "",
          matchScore: 0, // Will be updated if analyzed later
          status: "draft",
          coverLetterStatus: "ready",
          job: parsedJob,
          match: { score: 0, matchedKeywords: [], missingKeywords: [], recommendedFocusAreas: [], summary: "" },
        };
        await saveApplication(app as Application);
        setSaveMessage("Saved to application tracker ✓");
      }
      await refreshApplications();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      // Silently fail if save error, user still gets their export
    }
  };

  const handleLanguageChange = async (language: typeof cvLanguage) => {
    setLanguageError(null);
    setIsSwitchingLanguage(true);
    try {
      await setCvLanguage(language);
    } catch (err) {
      setLanguageError(
        err instanceof Error ? err.message : "Could not switch cover letter language."
      );
    } finally {
      setIsSwitchingLanguage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Cover Letter</h1>
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
            Draft for {parsedJob.title} at {parsedJob.company}. Edit the text,
            preview live, then export — no auto-submit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm font-medium text-success">{saveMessage}</span>}
          <ExportButtons
            disabled={!validation?.valid}
            disabledReason={
              !validation
                ? "Checking cover letter validation before export."
                : !validation.valid
                  ? "Restore the verified motivation paragraph before exporting."
                  : undefined
            }
            onExportPdf={async () => {
              await exportCoverLetterToPdf(
                generatedCoverLetter,
                parsedJob.company,
                parsedJob.title,
                { applicant: generatedCV?.sections.header, language: cvLanguage }
              );
              await handleExportComplete();
            }}
            onExportDocx={async () => {
              await exportCoverLetterToDocx(
                generatedCoverLetter,
                parsedJob.company,
                parsedJob.title,
                { applicant: generatedCV?.sections.header, language: cvLanguage }
              );
              await handleExportComplete();
            }}
          />
        </div>
      </div>

      {validation?.issues
        .filter((issue) => issue.severity === "error")
        .map((issue) => (
          <p
            key={`${issue.field}-${issue.message}`}
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          >
            {issue.message}
          </p>
        ))}

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <CoverLetterEditor
          letter={generatedCoverLetter}
          onChange={updateGeneratedCoverLetter}
          onReset={resetGeneratedCoverLetter}
          language={cvLanguage}
        />
        <CoverLetterPreview
          letter={generatedCoverLetter}
          language={cvLanguage}
          applicant={generatedCV?.sections.header}
          company={parsedJob.company}
          title={parsedJob.title}
        />
      </div>
    </div>
  );
}
