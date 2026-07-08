import { buildAnalyzerNextSteps } from "@/lib/analyzerNextSteps";

interface AnalyzerNextStepsProps {
  score: number;
  missingKeywords?: string[];
}

export default function AnalyzerNextSteps({
  score,
  missingKeywords = [],
}: AnalyzerNextStepsProps) {
  const steps = buildAnalyzerNextSteps(score, missingKeywords);

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">What to do next</h3>
          <p className="mt-1 text-sm text-foreground-secondary">
            Clear guidance for turning this match into a stronger application.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-border bg-background-secondary p-3"
          >
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
