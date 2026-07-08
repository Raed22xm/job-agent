"use client";

import { useMemo } from "react";
import { compareToBestPractices } from "@/lib/cv/bestPracticesReview";
import type { BestPracticeCheck, SendReadiness } from "@/lib/cv/bestPracticesReview";
import type { CVValidationResult, GeneratedCV, ParsedJob } from "@/types";

interface PreSendReviewModalProps {
  open: boolean;
  cv: GeneratedCV;
  parsedJob: ParsedJob;
  validation: CVValidationResult | null;
  isExporting: "pdf" | "docx" | null;
  exportError?: string | null;
  onClose: () => void;
  onExport: (type: "pdf" | "docx") => void;
}

const readinessStyles: Record<
  SendReadiness,
  { ring: string; badge: string; badgeText: string }
> = {
  ready: {
    ring: "stroke-success",
    badge: "bg-success/10 text-success border-success/20",
    badgeText: "Ready to send",
  },
  review: {
    ring: "stroke-warning",
    badge: "bg-warning/10 text-warning border-warning/20",
    badgeText: "Review suggested",
  },
  "not-ready": {
    ring: "stroke-danger",
    badge: "bg-danger/10 text-danger border-danger/20",
    badgeText: "Fix before sending",
  },
};

const statusIcon: Record<BestPracticeCheck["status"], string> = {
  pass: "✓",
  warn: "!",
  fail: "✗",
};

const statusRowClass: Record<BestPracticeCheck["status"], string> = {
  pass: "border-emerald-100 bg-success/10/50",
  warn: "border-amber-100 bg-warning/10/50",
  fail: "border-rose-100 bg-danger/10/50",
};

const statusTextClass: Record<BestPracticeCheck["status"], string> = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-danger",
};

const categoryLabel: Record<BestPracticeCheck["category"], string> = {
  ats: "ATS & tailoring",
  impact: "Impact & achievements",
  content: "Content",
  structure: "Structure & scan",
};

export default function PreSendReviewModal({
  open,
  cv,
  parsedJob,
  validation,
  isExporting,
  exportError,
  onClose,
  onExport,
}: PreSendReviewModalProps) {
  const review = useMemo(
    () => compareToBestPractices(cv, parsedJob),
    [cv, parsedJob]
  );

  if (!open) return null;

  const styles = readinessStyles[review.readiness];
  const validationBlocked = !validation?.valid;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (review.overallScore / 100) * circumference;

  const grouped = review.checks.reduce<Record<string, BestPracticeCheck[]>>(
    (acc, check) => {
      const key = check.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(check);
      return acc;
    },
    {}
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="presend-review-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/80"
        aria-label="Close review"
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  className="stroke-border"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className={styles.ring}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-foreground">
                  {review.overallScore}
                </span>
                <span className="text-[10px] text-foreground-tertiary">/ 100</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                Pre-send review
              </p>
              <h2
                id="presend-review-title"
                className="mt-1 text-lg font-semibold text-foreground"
              >
                Compare to best practices
              </h2>
              <p className="mt-1 text-sm text-foreground-secondary">{review.headline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
                >
                  {styles.badgeText}
                </span>
                <span className="rounded-full bg-background-secondary px-2.5 py-0.5 text-xs text-foreground-secondary">
                  {review.passCount} pass · {review.warnCount} warn ·{" "}
                  {review.failCount} fail
                </span>
                <span className="rounded-full bg-background-secondary px-2.5 py-0.5 text-xs text-foreground-secondary">
                  {parsedJob.title} @ {parsedJob.company}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="mb-4 text-xs text-foreground-secondary">
            Based on ATS research, recruiter scan patterns, and high-performing CV
            methods (tailoring, achievement bullets, quantified impact).
          </p>

          <div className="space-y-5">
            {(["ats", "impact", "content", "structure"] as const).map(
              (category) => {
                const items = grouped[category];
                if (!items?.length) return null;
                return (
                  <div key={category}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
                      {categoryLabel[category]}
                    </h3>
                    <ul className="space-y-2">
                      {items.map((check) => (
                        <li
                          key={check.id}
                          className={`rounded-lg border p-3 ${statusRowClass[check.status]}`}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${statusTextClass[check.status]}`}
                            >
                              {statusIcon[check.status]}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {check.label}
                              </p>
                              <p className="mt-0.5 text-xs text-foreground-secondary">
                                <span className="font-medium">Best:</span>{" "}
                                {check.bestPractice}
                              </p>
                              <p className="mt-1 text-xs text-foreground-secondary">
                                <span className="font-medium">Yours:</span>{" "}
                                {check.yourStatus}
                              </p>
                              {check.suggestion && (
                                <p className="mt-1 text-xs text-primary-dark">
                                  → {check.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
            )}
          </div>

          {validationBlocked && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              <p className="font-semibold">Validation errors must be fixed first</p>
              <p className="mt-1 text-xs">
                Close this review and resolve CV validation issues before export.
              </p>
            </div>
          )}

          {exportError && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {exportError}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background-secondary px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-background-secondary"
          >
            Keep editing
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={validationBlocked || isExporting !== null}
              onClick={() => onExport("pdf")}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting === "pdf" ? "Exporting…" : "Export PDF anyway"}
            </button>
            <button
              type="button"
              disabled={validationBlocked || isExporting !== null}
              onClick={() => onExport("docx")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting === "docx"
                ? "Exporting…"
                : review.readiness === "ready"
                  ? "Export DOCX & apply"
                  : "Export DOCX anyway"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
