"use client";

import Link from "next/link";
import { useJobAgent } from "@/context/JobAgentContext";
import {
  collectApplicationReminders,
  isOverdue,
} from "@/lib/trackerReminders";

export default function RemindersBanner() {
  const { applications } = useJobAgent();
  const reminders = collectApplicationReminders(applications);

  if (reminders.length === 0) return null;

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50 p-5">
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
          className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-100"
        >
          Open tracker
        </Link>
      </div>
      <ul className="mt-4 space-y-2">
        {reminders.slice(0, 5).map((item) => (
          <li
            key={`${item.application.id}-${item.kind}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm"
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
    </section>
  );
}
