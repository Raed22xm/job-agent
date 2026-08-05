"use client";

import { useState } from "react";
import Link from "next/link";
import { useJobAgent } from "@/context/JobAgentContext";
import {
  collectApplicationReminders,
  getApplicationsNeedingFollowUp,
  generateFollowUpEmail,
  isOverdue,
} from "@/lib/trackerReminders";

export default function RemindersBanner() {
  const { applications } = useJobAgent();
  const reminders = collectApplicationReminders(applications);
  const needsFollowUp = getApplicationsNeedingFollowUp(applications);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (reminders.length === 0 && needsFollowUp.length === 0) return null;

  const handleCopyFollowUp = (appId: string) => {
    const app = needsFollowUp.find((a) => a.id === appId);
    if (!app) return;

    const draft = generateFollowUpEmail(app, "Raed Ibrahim");
    void navigator.clipboard.writeText(
      `Subject: ${draft.subject}\n\n${draft.body}`
    );
    setCopiedId(appId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="space-y-3">
      {/* Existing deadline/follow-up reminders */}
      {reminders.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-violet-900">
                Due this week ({reminders.length})
              </h2>
              <p className="mt-1 text-sm text-violet-800/90">
                Deadlines and follow-ups needing attention.
              </p>
            </div>
            <Link
              href="/tracker?filter=due"
              className="rounded-lg border border-violet-300 bg-surface px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-100"
            >
              Open tracker
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {reminders.slice(0, 5).map((item) => (
              <li
                key={`${item.application.id}-${item.kind}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface/70 px-3 py-2 text-sm"
              >
                <span className="font-medium text-violet-950">
                  {item.application.jobTitle} · {item.application.company}
                </span>
                <span className="text-violet-800">
                  {item.kind === "deadline" ? "Deadline" : "Follow-up"}: {item.date}
                  {isOverdue(item.date) ? " (overdue)" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up suggestions for 7+ day old applications */}
      {needsFollowUp.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                📬 Follow-up suggested ({needsFollowUp.length})
              </h2>
              <p className="mt-1 text-sm text-amber-800/90">
                These applications are 7+ days old with no follow-up sent.
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {needsFollowUp.slice(0, 5).map((app) => {
              const daysSince = app.appliedDate
                ? Math.floor(
                    (Date.now() - new Date(app.appliedDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 7;

              return (
                <li
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface/70 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-amber-950">
                      {app.jobTitle} · {app.company}
                    </span>
                    <span className="ml-2 text-amber-700">
                      {daysSince} days ago
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyFollowUp(app.id)}
                    className="rounded-md border border-amber-300 bg-surface px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    {copiedId === app.id ? "✓ Copied!" : "📋 Copy follow-up email"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
