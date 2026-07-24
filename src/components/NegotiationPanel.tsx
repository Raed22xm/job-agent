import { useState } from "react";
import type { ParsedJob } from "@/types";

interface NegotiationPanelProps {
  jobDescription: string;
  matchScore: number;
}

export default function NegotiationPanel({ jobDescription, matchScore }: NegotiationPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          personaId: "default",
          matchScore,
        }),
      });

      if (!res.ok) throw new Error("Failed to predict salary");
      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error predicting salary");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6 shadow-sm mt-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary-dark">Market Salary & Negotiation</h2>
          <p className="mt-1 text-sm text-primary-dark">
            Use AI to predict the Danish market rate and generate a leverage-based negotiation script.
          </p>
        </div>
        {!result && (
          <button
            onClick={handlePredict}
            disabled={isLoading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:opacity-50"
          >
            {isLoading ? "Predicting..." : "Predict Salary"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger font-medium">Error: {error}</p>
      )}

      {result && (
        <div className="mt-6 space-y-6 border-t border-primary/20 pt-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-dark">
              Estimated Monthly Salary (DKK)
            </h3>
            <p className="mt-2 text-2xl font-black text-success">{result.estimatedSalaryRangeDKK}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-dark">
              Your Negotiation Leverage
            </h3>
            <ul className="mt-3 space-y-2">
              {result.leveragePoints.map((point: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-foreground-secondary">
                  <span className="text-success font-bold">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-dark">
              Negotiation Script
            </h3>
            <div className="mt-2 rounded-lg bg-surface p-4 border border-primary/15 shadow-inner">
              <p className="whitespace-pre-wrap text-sm text-foreground-secondary font-serif leading-relaxed">
                {result.negotiationScript}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
