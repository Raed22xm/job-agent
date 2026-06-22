"use client";

import type { Application, ApplicationStatus } from "@/types";

interface ApplicationTableProps {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}

const statusOptions: ApplicationStatus[] = [
  "draft",
  "ready",
  "applied",
  "interview",
  "rejected",
  "offer",
];

const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
  offer: "Offer",
};

const coverLetterLabels = {
  none: "None",
  draft: "Draft",
  ready: "Ready",
  sent: "Sent",
} as const;

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function ApplicationTable({
  applications,
  onStatusChange,
  onDelete,
}: ApplicationTableProps) {
  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-slate-700">No saved applications yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Analyze a job and save it from the Job Analyzer page.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">
            Saved job applications with match scores, status, and follow-up dates
          </caption>
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Job Title
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Company
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Location
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Match
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                CV Version
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Cover Letter
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Applied
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Follow-up
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Link
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{app.jobTitle}</td>
                <td className="px-4 py-3 text-slate-700">{app.company}</td>
                <td className="px-4 py-3 text-slate-600">{app.location}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {app.matchScore}%
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{app.cvVersion ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {coverLetterLabels[app.coverLetterStatus]}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={app.status}
                    onChange={(e) =>
                      onStatusChange(app.id, e.target.value as ApplicationStatus)
                    }
                    aria-label={`Status for ${app.jobTitle} at ${app.company}`}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none ring-brand-500 focus:ring-2"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(app.appliedDate)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(app.followUpDate)}
                </td>
                <td className="px-4 py-3">
                  {app.link ? (
                    <a
                      href={app.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(app.id)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
