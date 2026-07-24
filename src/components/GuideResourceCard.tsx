"use client";

import Link from "next/link";
import type { GuideResource } from "@/lib/jobSearchGuide";

const badgeStyles: Record<
  NonNullable<GuideResource["badge"]>,
  string
> = {
  recommended: "bg-primary/10 text-primary-dark",
  "supported-import": "bg-success/10 text-success",
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
    <article className="flex h-full flex-col glass-card p-5 rounded-xl transition hover:border-primary/20 hover:shadow-lg">
      <div className="flex flex-wrap items-start gap-2">
        <h3 className="flex-1 text-base font-semibold text-foreground">
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

      <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-secondary">
        {resource.description}
      </p>

      {resource.steps && resource.steps.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-foreground-secondary">
          {resource.steps.map((step, index) => (
            <li key={`${step}-${index}`}>{step}</li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.slice(0, 4).map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="rounded-md bg-background-secondary px-2 py-0.5 text-xs text-foreground-secondary"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
        {resource.appLink && (
          <Link
            href={resource.appLink}
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            Open in app →
          </Link>
        )}
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground-secondary hover:text-foreground"
          >
            Visit site ↗
          </a>
        )}
      </div>
    </article>
  );
}
