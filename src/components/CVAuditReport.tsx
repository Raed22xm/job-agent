"use client";

import Link from "next/link";
import type { CVAuditResult } from "@/lib/agent/cvAudit";

interface CVAuditReportProps {
  result: CVAuditResult;
  mode: string;
}

const gradeColors: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-50 border-emerald-200",
  B: "text-blue-600 bg-blue-50 border-blue-200",
  C: "text-amber-600 bg-amber-50 border-amber-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  F: "text-rose-600 bg-rose-50 border-rose-200",
};

const labelColors: Record<string, string> = {
  Strong: "bg-emerald-100 text-emerald-700",
  Good: "bg-blue-100 text-blue-700",
  "Needs Work": "bg-amber-100 text-amber-700",
  Weak: "bg-rose-100 text-rose-700",
};

const riskColors: Record<string, string> = {
  Low: "text-emerald-600 bg-emerald-50",
  Medium: "text-amber-600 bg-amber-50",
  High: "text-rose-600 bg-rose-50",
};

export default function CVAuditReport({ result, mode }: CVAuditReportProps) {
  const scoreRingDashoffset = Math.round(
    251.2 - (result.overallScore / 100) * 251.2
  );

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-4">
        {/* Score ring */}
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
            <circle
              cx="50" cy="50" r="40"
              fill="none" stroke="#e2e8f0" strokeWidth="10"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={result.overallScore >= 70 ? "#10b981" : result.overallScore >= 50 ? "#f59e0b" : "#ef4444"}
              strokeWidth="10"
              strokeDasharray="251.2"
              strokeDashoffset={scoreRingDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{result.overallScore}</span>
            <span className="text-xs text-foreground-secondary">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`rounded-lg border px-3 py-1 text-lg font-bold ${gradeColors[result.grade]}`}>
              Grade {result.grade}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskColors[result.atsRisk]}`}>
              ATS Risk: {result.atsRisk}
            </span>
            <span className="rounded-full bg-background-secondary border border-border px-3 py-1 text-xs text-foreground-secondary">
              ~{result.wordCount} words
            </span>
            {mode !== "ai" && (
              <span className="rounded-full bg-background-secondary border border-border px-2 py-1 text-xs text-foreground-tertiary">
                Local scoring
              </span>
            )}
          </div>

          {result.topPriorities.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-tertiary mb-2">
                Top Priorities
              </p>
              <ul className="space-y-1">
                {result.topPriorities.slice(0, 3).map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                    <span className="mt-0.5 text-rose-400 shrink-0">▲</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Section breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Section Breakdown</h3>
        <div className="space-y-3">
          {result.sections.map((section) => (
            <div
              key={section.section}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-foreground text-sm">{section.section}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${labelColors[section.label]}`}>
                    {section.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground-secondary shrink-0">{section.score}/100</span>
              </div>

              {/* Score bar */}
              <div className="h-1.5 w-full rounded-full bg-background-secondary mb-3">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${section.score}%`,
                    backgroundColor:
                      section.score >= 70 ? "#10b981" : section.score >= 50 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>

              {section.issues.length > 0 && (
                <ul className="mb-2 space-y-0.5">
                  {section.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-rose-700">
                      <span className="shrink-0">✗</span> {issue}
                    </li>
                  ))}
                </ul>
              )}

              {section.tips.length > 0 && (
                <ul className="mb-2 space-y-0.5">
                  {section.tips.slice(0, 2).map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-foreground-secondary">
                      <span className="shrink-0 text-primary">→</span> {tip}
                    </li>
                  ))}
                </ul>
              )}

              {section.rewrittenExample && (
                <pre className="mt-2 rounded-lg bg-background-secondary border border-border p-3 text-xs text-foreground-secondary whitespace-pre-wrap font-mono">
                  {section.rewrittenExample}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA — fix in CV Generator */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-primary">Ready to apply the fixes?</p>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Analyse a job first, then generate a tailored CV with these improvements applied.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/analyzer"
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Analyze a job →
          </Link>
          <Link
            href="/cv"
            className="rounded-lg border border-primary bg-background px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            Go to CV Generator →
          </Link>
        </div>
      </div>
    </div>
  );
}
