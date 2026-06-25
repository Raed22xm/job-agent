import type { CVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";

interface ATSKeywordCoverageProps {
  coverage: CVKeywordCoverage;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

function ringColor(score: number): string {
  if (score >= 75) return "stroke-emerald-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-rose-500";
}

export default function ATSKeywordCoverage({ coverage }: ATSKeywordCoverageProps) {
  if (coverage.total === 0) return null;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (coverage.score / 100) * circumference;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="8"
              className="stroke-slate-100"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={ringColor(coverage.score)}
            />
          </svg>
          <div
            className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${scoreColor(coverage.score)}`}
          >
            {coverage.score}%
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              ATS keyword coverage
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {coverage.matched.length} of {coverage.total} job keywords appear in
              your CV text. Reorder bullets or add matched terms naturally where
              truthful.
            </p>
          </div>

          {coverage.matched.length > 0 ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                In CV ({coverage.matched.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {coverage.matched.slice(0, 12).map((term) => (
                  <span
                    key={term}
                    className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    {term}
                  </span>
                ))}
                {coverage.matched.length > 12 ? (
                  <span className="text-xs text-slate-500">
                    +{coverage.matched.length - 12} more
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {coverage.missing.length > 0 ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Missing from CV ({coverage.missing.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {coverage.missing.slice(0, 10).map((term) => (
                  <span
                    key={term}
                    className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                  >
                    {term}
                  </span>
                ))}
                {coverage.missing.length > 10 ? (
                  <span className="text-xs text-slate-500">
                    +{coverage.missing.length - 10} more — gap or transferable
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
