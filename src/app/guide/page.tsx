"use client";

import { useMemo, useState } from "react";
import GuideResourceCard from "@/components/GuideResourceCard";
import {
  filterGuideResources,
  GUIDE_CATEGORIES,
  GUIDE_RESOURCES,
  GUIDE_UPDATES,
  type GuideCategory,
} from "@/lib/jobSearchGuide";

export default function GuidePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GuideCategory | "all">("all");

  const filteredResources = useMemo(
    () => filterGuideResources(GUIDE_RESOURCES, query, category),
    [query, category]
  );

  const activeCategory = GUIDE_CATEGORIES.find((item) => item.id === category);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Job search hub
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Methods, tools & search agent guide
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Curated ways to find jobs in Denmark, create an ATS-friendly CV from
          verified data, and use Job Agent plus Cursor chat in the right order.
          Search below to filter platforms, methods, and workflow tips.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label
              htmlFor="guide-search"
              className="text-sm font-medium text-slate-700"
            >
              Search guide
            </label>
            <input
              id="guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. jobindex, ATS, React, cursor, tracker…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
            />
          </div>
          <p className="text-sm text-slate-500 lg:pb-2">
            {filteredResources.length} result
            {filteredResources.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {GUIDE_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                category === item.id
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {activeCategory && (
          <p className="text-sm text-slate-600">{activeCategory.description}</p>
        )}
      </section>

      <section>
        {filteredResources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm font-medium text-slate-700">No matches found.</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a broader search or switch category.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredResources.map((resource) => (
              <GuideResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Recommended workflow
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>Find jobs on Jobindex, The Hub, or company pages.</li>
            <li>Import or paste into Job Analyzer — check match score.</li>
            <li>Edit CV and cover letter — export DOCX.</li>
            <li>Apply manually and track dates in the tracker.</li>
            <li>Use Cursor chat only for difficult tailoring or gap framing.</li>
          </ol>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Updates & tips
          </h2>
          <ul className="mt-3 space-y-3">
            {GUIDE_UPDATES.map((update) => (
              <li
                key={update.date + update.title}
                className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-xs font-medium text-slate-500">{update.date}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {update.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{update.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
