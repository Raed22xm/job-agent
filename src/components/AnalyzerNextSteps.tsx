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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">What to do next</h3>
          <p className="mt-1 text-sm text-slate-500">
            Clear guidance for turning this match into a stronger application.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <p className="text-sm font-semibold text-slate-900">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
