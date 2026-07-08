"use client";

import { useMemo } from "react";
import type { GeneratedCV, ParsedJob } from "@/types";
import { bulletImpactScore, summaryQualityScore } from "@/lib/cv/cvFeedback";
import { scoreCVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";

interface CVImpactScoreProps {
  cv: GeneratedCV;
  parsedJob: ParsedJob;
}

interface SubScore {
  label: string;
  description: string;
  score: number;
  color: (s: number) => string;
  trackColor: (s: number) => string;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

function barColor(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
}

function label(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Fair";
  return "Needs work";
}

function SubScoreBar({ name, desc, score }: { name: string; desc: string; score: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground-secondary">{name}</p>
          <p className="text-[11px] text-foreground-secondary">{desc}</p>
        </div>
        <span className={`shrink-0 text-sm font-bold ${scoreColor(score)}`}>
          {score}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-secondary">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function CVImpactScore({ cv, parsedJob }: CVImpactScoreProps) {
  const atsScore = useMemo(
    () => scoreCVKeywordCoverage(cv, parsedJob).score,
    [cv, parsedJob]
  );
  const bulletScore = useMemo(() => bulletImpactScore(cv), [cv]);
  const summaryScore = useMemo(() => summaryQualityScore(cv), [cv]);

  const composite = Math.round((atsScore * 0.45 + bulletScore * 0.35 + summaryScore * 0.2));

  // Donut ring
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (composite / 100) * circumference;

  return (
    <section className="glass-panel rounded-xl">
      <div className="flex flex-wrap items-start gap-6 px-6 py-5">
        {/* Composite ring */}
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r={radius}
              fill="none" strokeWidth="8"
              className="stroke-border"
            />
            <circle
              cx="50" cy="50" r={radius}
              fill="none" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={
                composite >= 75
                  ? "stroke-success"
                  : composite >= 50
                  ? "stroke-warning"
                  : "stroke-danger"
              }
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold leading-none ${scoreColor(composite)}`}>
              {composite}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-tertiary">
              Impact
            </span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">CV Impact Score</h2>
            <p className={`mt-0.5 text-sm font-medium ${scoreColor(composite)}`}>
              {label(composite)} · {composite}/100
            </p>
          </div>

          <SubScoreBar
            name="ATS Keyword Coverage"
            desc="Job keywords found in your CV text"
            score={atsScore}
          />
          <SubScoreBar
            name="Bullet Quality"
            desc="Action verbs + quantification in experience"
            score={bulletScore}
          />
          <SubScoreBar
            name="Summary Quality"
            desc="Word count, opener strength, and metrics"
            score={summaryScore}
          />
        </div>
      </div>

      {composite < 65 && (
        <div className="border-t border-border bg-background-secondary px-6 py-3">
          <p className="text-xs text-foreground-secondary">
            <span className="font-semibold">Priority:</span>{" "}
            {bulletScore < atsScore && bulletScore < summaryScore
              ? "Improve experience bullets — add strong action verbs and at least one metric per bullet."
              : atsScore < summaryScore
              ? "Increase ATS coverage — weave missing job keywords naturally into bullets and summary."
              : "Strengthen your summary — lead with your title, add a quantified achievement."}
          </p>
        </div>
      )}
    </section>
  );
}
