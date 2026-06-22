interface MatchScoreCardProps {
  score: number;
  summary: string;
  matchedCount?: number;
  missingCount?: number;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

function scoreRingColor(score: number): string {
  if (score >= 75) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-rose-500";
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Moderate match";
  if (score >= 25) return "Partial match";
  return "Low match";
}

export default function MatchScoreCard({
  score,
  summary,
  matchedCount,
  missingCount,
}: MatchScoreCardProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">ATS Match Score</h2>
          <p className="mt-1 text-sm text-slate-500">
            Keyword overlap between the job posting and your verified master CV.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            score >= 75
              ? "bg-emerald-50 text-emerald-700"
              : score >= 50
                ? "bg-amber-50 text-amber-700"
                : "bg-rose-50 text-rose-700"
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
              stroke="#e2e8f0"
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
            <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
          {(matchedCount !== undefined || missingCount !== undefined) && (
            <div className="flex flex-wrap gap-3 text-xs font-medium">
              {matchedCount !== undefined && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  {matchedCount} matching
                </span>
              )}
              {missingCount !== undefined && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  {missingCount} missing
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
