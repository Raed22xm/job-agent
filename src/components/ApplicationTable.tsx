"use client";

import { Fragment, useState } from "react";
import type {
  Application,
  ApplicationStatus,
  CoverLetterStatus,
} from "@/types";

interface ApplicationTableProps {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<
        Application,
        | "notes"
        | "deadline"
        | "cvVersion"
        | "coverLetterStatus"
        | "recruiterContact"
        | "appliedDate"
        | "followUpDate"
      >
    >
  ) => void;
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

const coverLetterOptions: CoverLetterStatus[] = [
  "none",
  "draft",
  "ready",
  "sent",
];

const coverLetterLabels: Record<CoverLetterStatus, string> = {
  none: "None",
  draft: "Draft",
  ready: "Ready",
  sent: "Sent",
};

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

interface EditFieldsProps {
  app: Application;
  onUpdate: ApplicationTableProps["onUpdate"];
  onClose: () => void;
}

function EditFields({ app, onUpdate, onClose }: EditFieldsProps) {
  const [cvVersion, setCvVersion] = useState(app.cvVersion ?? "");
  const [coverLetterStatus, setCoverLetterStatus] = useState(
    app.coverLetterStatus
  );
  const [recruiterContact, setRecruiterContact] = useState(
    app.recruiterContact ?? ""
  );
  const [deadline, setDeadline] = useState(toDateInputValue(app.deadline));
  const [appliedDate, setAppliedDate] = useState(
    toDateInputValue(app.appliedDate)
  );
  const [followUpDate, setFollowUpDate] = useState(
    toDateInputValue(app.followUpDate)
  );
  const [notes, setNotes] = useState(app.notes ?? "");

  const handleSave = () => {
    onUpdate(app.id, {
      cvVersion: cvVersion.trim() || undefined,
      coverLetterStatus,
      recruiterContact: recruiterContact.trim() || undefined,
      deadline: deadline || undefined,
      appliedDate: appliedDate || undefined,
      followUpDate: followUpDate || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label
            htmlFor={`cv-version-${app.id}`}
            className="text-xs font-medium text-slate-700"
          >
            CV version
          </label>
          <input
            id={`cv-version-${app.id}`}
            type="text"
            value={cvVersion}
            onChange={(e) => setCvVersion(e.target.value)}
            placeholder="e.g. tailored-react-v2"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor={`cover-letter-${app.id}`}
            className="text-xs font-medium text-slate-700"
          >
            Cover letter status
          </label>
          <select
            id={`cover-letter-${app.id}`}
            value={coverLetterStatus}
            onChange={(e) =>
              setCoverLetterStatus(e.target.value as CoverLetterStatus)
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          >
            {coverLetterOptions.map((status) => (
              <option key={status} value={status}>
                {coverLetterLabels[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`recruiter-${app.id}`}
            className="text-xs font-medium text-slate-700"
          >
            Recruiter contact
          </label>
          <input
            id={`recruiter-${app.id}`}
            type="text"
            value={recruiterContact}
            onChange={(e) => setRecruiterContact(e.target.value)}
            placeholder="Name, email, or LinkedIn"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor={`deadline-${app.id}`}
            className="text-xs font-medium text-slate-700"
          >
            Deadline
          </label>
          <input
            id={`deadline-${app.id}`}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor={`applied-${app.id}`}
            className="text-xs font-medium text-slate-700"
          >
            Applied date
          </label>
          <input
            id={`applied-${app.id}`}
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor={`followup-${app.id}`}
            className="text-xs font-medium text-slate-700"
          >
            Follow-up date
          </label>
          <input
            id={`followup-${app.id}`}
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={`notes-${app.id}`}
          className="text-xs font-medium text-slate-700"
        >
          Notes
        </label>
        <textarea
          id={`notes-${app.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Interview prep, feedback, next steps…"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Save details
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ApplicationTable({
  applications,
  onStatusChange,
  onUpdate,
  onDelete,
}: ApplicationTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-slate-700">
          No saved applications yet.
        </p>
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
              <Fragment key={app.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {app.jobTitle}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{app.company}</td>
                  <td className="px-4 py-3 text-slate-600">{app.location}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      {app.matchScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {app.cvVersion ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {coverLetterLabels[app.coverLetterStatus]}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        onStatusChange(
                          app.id,
                          e.target.value as ApplicationStatus
                        )
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
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === app.id ? null : app.id)
                        }
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        {expandedId === app.id ? "Close" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(app.id)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === app.id && (
                  <tr>
                    <td colSpan={11} className="px-4 py-3">
                      <EditFields
                        app={app}
                        onUpdate={onUpdate}
                        onClose={() => setExpandedId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
