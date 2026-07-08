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
      <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Job search hub
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          Methods, tools & search agent guide
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground-secondary sm:text-base">
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
              className="text-sm font-medium text-foreground-secondary"
            >
              Search guide
            </label>
            <input
              id="guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. jobindex, ATS, React, cursor, tracker…"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
            />
          </div>
          <p className="text-sm text-foreground-secondary lg:pb-2">
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
              aria-pressed={category === item.id}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                category === item.id
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-foreground-secondary hover:bg-background-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {activeCategory && (
          <p className="text-sm text-foreground-secondary">{activeCategory.description}</p>
        )}
      </section>

      <section>
        {filteredResources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="text-sm font-medium text-foreground-secondary">No matches found.</p>
            <p className="mt-1 text-sm text-foreground-secondary">
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
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Recommended workflow
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground-secondary">
            <li>Find jobs on Jobindex, The Hub, or company pages.</li>
            <li>Import or paste into Job Analyzer — check match score.</li>
            <li>Edit CV and cover letter — export DOCX.</li>
            <li>Apply manually and track dates in the tracker.</li>
            <li>Use Cursor chat only for difficult tailoring or gap framing.</li>
          </ol>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Updates & tips
          </h2>
          <ul className="mt-3 space-y-3">
            {GUIDE_UPDATES.map((update) => (
              <li
                key={update.date + update.title}
                className="border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <p className="text-xs font-medium text-foreground-secondary">{update.date}</p>
                <p className="text-sm font-semibold text-foreground">
                  {update.title}
                </p>
                <p className="mt-0.5 text-sm text-foreground-secondary">{update.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
