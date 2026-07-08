import type { CVKeywordCoverage } from "@/lib/cv/scoreCVKeywords";

interface ATSKeywordCoverageProps {
  coverage: CVKeywordCoverage;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

function ringColor(score: number): string {
  if (score >= 75) return "stroke-success";
  if (score >= 50) return "stroke-warning";
  return "stroke-danger";
}

export default function ATSKeywordCoverage({ coverage }: ATSKeywordCoverageProps) {
  if (coverage.total === 0) return null;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (coverage.score / 100) * circumference;

  return (
    <section className="glass-card p-5 rounded-xl">
      <div className="flex flex-wrap items-start gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="8"
              className="stroke-border"
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
            <h2 className="text-base font-semibold text-foreground">
              ATS keyword coverage
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              {coverage.matched.length} of {coverage.total} job keywords appear in
              your CV text. Reorder bullets or add matched terms naturally where
              truthful.
            </p>
          </div>

          {coverage.matched.length > 0 ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-success">
                In CV ({coverage.matched.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {coverage.matched.slice(0, 12).map((term) => (
                  <span
                    key={term}
                    className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    {term}
                  </span>
                ))}
                {coverage.matched.length > 12 ? (
                  <span className="text-xs text-foreground-secondary">
                    +{coverage.matched.length - 12} more
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {coverage.missing.length > 0 ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-warning">
                Missing from CV ({coverage.missing.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {coverage.missing.slice(0, 10).map((term) => (
                  <span
                    key={term}
                    className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning"
                  >
                    {term}
                  </span>
                ))}
                {coverage.missing.length > 10 ? (
                  <span className="text-xs text-foreground-secondary">
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
