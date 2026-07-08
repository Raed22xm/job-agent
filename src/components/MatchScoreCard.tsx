import type { ScoreBreakdown } from "@/types";

interface MatchScoreCardProps {
  score: number;
  summary: string;
  matchedCount?: number;
  missingCount?: number;
  scoreBreakdown?: ScoreBreakdown;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

function scoreRingColor(score: number): string {
  if (score >= 75) return "stroke-success";
  if (score >= 50) return "stroke-warning";
  return "stroke-danger";
}

function hasValidBreakdown(
  breakdown: ScoreBreakdown | undefined
): breakdown is ScoreBreakdown {
  if (!breakdown) return false;
  return (
    breakdown.skillsMatch != null &&
    breakdown.experienceMatch != null &&
    breakdown.location != null &&
    breakdown.language != null &&
    breakdown.juniorFriendliness != null &&
    breakdown.portfolioRelevance != null &&
    typeof breakdown.overall === "number"
  );
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Moderate match";
  if (score >= 25) return "Partial match";
  return "Low match";
}

function CategoryBar({
  label,
  matched,
  total,
  weight,
  score,
}: {
  label: string;
  matched: number;
  total: number;
  weight: number;
  score: number;
}) {
  if (total === 0) return null;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {label}{" "}
          <span className="font-normal text-foreground-tertiary">({weight} pts)</span>
        </span>
        <span className="text-foreground-secondary">
          {matched}/{total} · {score}%
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full"
        style={{ background: "var(--surface-border)" }}
      >
        <div
          className={`h-full rounded-full transition-all ${
            score >= 75
              ? "bg-success"
              : score >= 50
                ? "bg-warning"
                : "bg-danger"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function MatchScoreCard({
  score,
  summary,
  matchedCount,
  missingCount,
  scoreBreakdown,
}: MatchScoreCardProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Match Score</h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            Weighted comparison between the job posting and your verified master CV.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            score >= 75
              ? "badge-success"
              : score >= 50
                ? "badge-warning"
                : "badge-danger"
          }`}
        >
          {scoreLabel(score)}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-32 w-32 shrink-0 sm:mx-0">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              style={{ stroke: "var(--surface-border)" }}
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              className={scoreRingColor(score)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              data-testid="score-value"
              className={`text-3xl font-bold ${scoreColor(score)}`}
            >
              {score}%
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm leading-relaxed text-foreground-secondary">{summary}</p>
          {(matchedCount !== undefined || missingCount !== undefined) && (
            <div className="flex flex-wrap gap-3 text-xs font-medium">
              {matchedCount !== undefined && (
                <span className="badge-success">
                  {matchedCount} matching keywords
                </span>
              )}
              {missingCount !== undefined && (
                <span className="badge-warning">
                  {missingCount} missing keywords
                </span>
              )}
            </div>
          )}

          {hasValidBreakdown(scoreBreakdown) && (
            <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--surface-border)" }}>
              <CategoryBar label="Skills Match" {...scoreBreakdown.skillsMatch} />
              <CategoryBar
                label="Experience Match"
                {...scoreBreakdown.experienceMatch}
              />
              <CategoryBar label="Location" {...scoreBreakdown.location} />
              <CategoryBar label="Language" {...scoreBreakdown.language} />
              <CategoryBar
                label="Junior-Friendliness"
                {...scoreBreakdown.juniorFriendliness}
              />
              <CategoryBar
                label="Portfolio Relevance"
                {...scoreBreakdown.portfolioRelevance}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
