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
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Job</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Company</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Match</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Updated</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{app.job.title}</td>
                <td className="px-4 py-3 text-slate-700">{app.job.company}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {app.match.score}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={app.status}
                    onChange={(e) =>
                      onStatusChange(app.id, e.target.value as ApplicationStatus)
                    }
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
                  {new Date(app.updatedAt).toLocaleDateString()}
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
