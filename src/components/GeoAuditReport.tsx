"use client";

import Link from "next/link";
import type { GeoAuditResult, LocationScore } from "@/lib/agent/geoAudit";

interface GeoAuditReportProps {
  result: GeoAuditResult;
}

const tierColors: Record<LocationScore["tier"], string> = {
  "Top Pick": "bg-emerald-100 text-emerald-800 border-emerald-300",
  Strong: "bg-blue-100 text-blue-800 border-blue-300",
  Viable: "bg-amber-100 text-amber-800 border-amber-300",
  Stretch: "bg-slate-100 text-slate-600 border-slate-300",
};

const demandBarColor = (score: number) => {
  if (score >= 70) return "#10b981"; // emerald
  if (score >= 50) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

const barrierColors: Record<LocationScore["languageBarrier"], string> = {
  None: "text-emerald-600",
  Low: "text-blue-600",
  Medium: "text-amber-600",
  High: "text-rose-600",
};

function DemandRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="32" cy="32" r="28"
          fill="none"
          stroke={demandBarColor(score)}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-900">{score}</span>
      </div>
    </div>
  );
}

function LocationCard({ loc, isTop }: { loc: LocationScore; isTop: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
        isTop
          ? "border-emerald-300 bg-emerald-50 shadow-sm"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-4">
        <DemandRing score={loc.demandScore} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl leading-none">{loc.flag}</span>
            <h3 className="text-base font-semibold text-slate-900">{loc.city}</h3>
            {isTop && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                ★ Top Pick
              </span>
            )}
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tierColors[loc.tier]}`}
            >
              {loc.tier}
            </span>
          </div>

          {/* Demand bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${loc.demandScore}%`, backgroundColor: demandBarColor(loc.demandScore) }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Est. Roles
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-900">
            ~{loc.estimatedRoles.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Salary Band
          </dt>
          <dd className="mt-0.5 font-semibold text-slate-900 text-xs leading-snug">
            {loc.salaryBand}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Language
          </dt>
          <dd className={`mt-0.5 font-semibold text-xs ${barrierColors[loc.languageBarrier]}`}>
            {loc.languageBarrier === "None" ? "✓ None" : `⚠ ${loc.languageBarrier}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Remote OK
          </dt>
          <dd className="mt-0.5 font-semibold text-xs">
            {loc.remoteEligible ? (
              <span className="text-emerald-600">✓ Yes</span>
            ) : (
              <span className="text-slate-400">On-site</span>
            )}
          </dd>
        </div>
      </dl>

      {/* Commute */}
      <p className="mt-3 text-xs text-slate-500">
        🚆 {loc.commuteFromHome}
      </p>

      {/* Top skills */}
      {loc.topMatchingSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {loc.topMatchingSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Market note */}
      <p className="mt-3 text-xs leading-relaxed text-slate-600 italic">
        {loc.marketNote}
      </p>

      {/* Search jobs CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <Link
          href={`/agent?location=${encodeURIComponent(loc.remoteEligible && loc.id.startsWith('remote') ? 'Remote' : loc.city)}`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            isTop
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          🔍 Search jobs here
        </Link>
      </div>
    </div>
  );
}

export default function GeoAuditReport({ result }: GeoAuditReportProps) {
  const { locations, topRecommendation, recommendationReason, aiNarrative, mode } = result;

  return (
    <div className="space-y-8">
      {/* Top recommendation banner */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          {/* Large ring */}
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#d1fae5" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={Math.round(251.2 - (topRecommendation.demandScore / 100) * 251.2)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-emerald-700">
                {topRecommendation.demandScore}
              </span>
              <span className="text-xs text-emerald-600">/ 100</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Top Market Recommendation
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {topRecommendation.flag} {topRecommendation.city}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {recommendationReason}
            </p>
            {mode !== "ai" && (
              <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Local scoring
              </span>
            )}
          </div>
        </div>

        {/* AI narrative */}
        {aiNarrative && (
          <blockquote className="mt-4 border-l-4 border-emerald-400 pl-4 text-sm italic text-slate-700 leading-relaxed">
            {aiNarrative}
          </blockquote>
        )}
      </div>

      {/* Location grid */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
          All Markets — Ranked by Demand Score
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              isTop={loc.id === topRecommendation.id}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> 70–100: High demand
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> 50–69: Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-400" /> &lt;50: Low / Stretch
        </span>
        <span className="ml-auto">
          Demand scores based on DK job board signals & Eurostat tech hiring indices 2024-25.
        </span>
      </div>
    </div>
  );
}
