"use client";

import { useMemo } from "react";
import { buildGapSuggestions } from "@/lib/gapSuggestions";
import { getMasterCV } from "@/lib/matchCV";

interface GapHonestyPanelProps {
  missingKeywords: string[];
}

export default function GapHonestyPanel({ missingKeywords }: GapHonestyPanelProps) {
  const suggestions = useMemo(
    () => buildGapSuggestions(missingKeywords, getMasterCV()),
    [missingKeywords]
  );

  if (missingKeywords.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Gap honesty</h2>
      <p className="mt-1 text-sm text-slate-600">
        How to handle missing keywords in your cover letter — verified facts only,
        no fabrication.
      </p>

      <ul className="mt-4 space-y-3">
        {suggestions.map((item) => (
          <li
            key={item.missing}
            className={`rounded-xl border px-4 py-3 text-sm ${
              item.status === "gap"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-brand-100 bg-brand-50 text-brand-950"
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
    </section>
  );
}
