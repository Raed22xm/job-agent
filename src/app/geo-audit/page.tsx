"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GeoAuditReport from "@/components/GeoAuditReport";
import type { GeoAuditResult } from "@/lib/agent/geoAudit";

type Status = "idle" | "loading" | "done" | "error";

export default function GeoAuditPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GeoAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/agent/geo-audit", { method: "POST" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = (await res.json()) as GeoAuditResult;
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed. Please retry.");
      setStatus("error");
    }
  };

  // Auto-run on mount
  useEffect(() => {
    void runAudit();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Job Agent · Geo Audit
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Geographic Job Market Audit
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Scores your CV skills against job market demand across Danish cities and
            remote tiers — so you know exactly where to focus your search.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => void runAudit()}
            disabled={status === "loading"}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? "Running…" : "↻ Re-run Audit"}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Home
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 animate-spin text-brand-600" viewBox="0 0 50 50">
              <circle
                cx="25" cy="25" r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray="90"
                strokeDashoffset="60"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">
            Analysing job markets…
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Scoring Copenhagen, Aarhus, Odense, Aalborg, Remote EU &amp; Global
          </p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-medium text-rose-800">
            {error ?? "Something went wrong."}
          </p>
          <button
            onClick={() => void runAudit()}
            className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {status === "done" && result && (
        <GeoAuditReport result={result} />
      )}

      {/* Info footer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-700">Data note:</strong> Demand scores are
        derived from aggregated Danish and European job board signals (Jobnet, Jobindex,
        LinkedIn, Adzuna) and Eurostat tech hiring indices for 2024–25. Role estimates
        and salary bands are indicative ranges, not guarantees. All data is based on
        verified skills in{" "}
        <code className="rounded bg-slate-200 px-1">data/master-cv.json</code>.
      </div>
    </div>
  );
}
