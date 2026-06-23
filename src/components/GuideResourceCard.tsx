"use client";

import Link from "next/link";
import type { GuideResource } from "@/lib/jobSearchGuide";

const badgeStyles: Record<
  NonNullable<GuideResource["badge"]>,
  string
> = {
  recommended: "bg-brand-50 text-brand-700",
  "supported-import": "bg-emerald-50 text-emerald-700",
  danish: "bg-sky-50 text-sky-700",
};

const badgeLabels: Record<NonNullable<GuideResource["badge"]>, string> = {
  recommended: "Recommended",
  "supported-import": "URL import",
  danish: "Denmark",
};

interface GuideResourceCardProps {
  resource: GuideResource;
}

export default function GuideResourceCard({ resource }: GuideResourceCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex flex-wrap items-start gap-2">
        <h3 className="flex-1 text-base font-semibold text-slate-900">
          {resource.title}
        </h3>
        {resource.badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyles[resource.badge]}`}
          >
            {badgeLabels[resource.badge]}
          </span>
        )}
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {resource.description}
      </p>

      {resource.steps && resource.steps.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          {resource.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        {resource.appLink && (
          <Link
            href={resource.appLink}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Open in app →
          </Link>
        )}
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Visit site ↗
          </a>
        )}
      </div>
    </article>
  );
}
