"use client";

import { useEffect, useState } from "react";
import type { GapSuggestion } from "@/lib/gapSuggestions";

interface GapHonestyPanelProps {
  missingKeywords: string[];
}

export default function GapHonestyPanel({ missingKeywords }: GapHonestyPanelProps) {
  const [suggestions, setSuggestions] = useState<GapSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (missingKeywords.length === 0) {
      setSuggestions([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setError(null);

    void fetch("/api/gap-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missingKeywords }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          suggestions?: GapSuggestion[];
        };

        if (!response.ok || !Array.isArray(data.suggestions)) {
          throw new Error(data.error ?? `Gap suggestions failed (${response.status})`);
        }

        setSuggestions(data.suggestions);
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not load gap suggestions."
        );
      });

    return () => controller.abort();
  }, [missingKeywords]);

  if (missingKeywords.length === 0) {
    return null;
  }

  return (
    <section className="glass-card">
      <h2 className="text-lg font-semibold text-foreground">Gap honesty</h2>
      <p className="mt-1 text-sm text-foreground-secondary">
        How to handle missing keywords in your cover letter — verified facts only,
        no fabrication.
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {error}
        </p>
      ) : suggestions.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-secondary">Checking verified overlap...</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {suggestions.map((item) => (
            <li
              key={item.missing}
              className={`rounded-xl border px-4 py-3 text-sm ${
                item.status === "gap"
                  ? "border-warning/20 bg-warning/10 text-amber-950"
                  : "border-primary/15 bg-primary/10 text-primary-dark"
              }`}
            >
              <p className="font-semibold">{item.missing}</p>
              <p className="mt-1 leading-relaxed opacity-90">{item.message}</p>
              {item.relatedVerified && item.relatedVerified.length > 0 && (
                <p className="mt-2 text-xs font-medium uppercase tracking-wide opacity-75">
                  Verified overlap: {item.relatedVerified.join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
