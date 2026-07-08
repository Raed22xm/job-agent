"use client";

import { Fragment, useState } from "react";
import InterviewPrepModal from "@/components/InterviewPrepModal";
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
        | "jobnetLogged"
        | "jobnetLoggedDate"
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
    <div className="space-y-4 rounded-lg p-4" style={{ background: "var(--background-secondary)", border: "1px solid var(--surface-border)" }}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label
            htmlFor={`cv-version-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            CV version
          </label>
          <input
            id={`cv-version-${app.id}`}
            type="text"
            value={cvVersion}
            onChange={(e) => setCvVersion(e.target.value)}
            placeholder="e.g. tailored-react-v2"
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`cover-letter-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Cover letter status
          </label>
          <select
            id={`cover-letter-${app.id}`}
            value={coverLetterStatus}
            onChange={(e) =>
              setCoverLetterStatus(e.target.value as CoverLetterStatus)
            }
            className="mt-1 field-input-compact"
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
            className="text-xs font-medium text-foreground-secondary"
          >
            Recruiter contact
          </label>
          <input
            id={`recruiter-${app.id}`}
            type="text"
            value={recruiterContact}
            onChange={(e) => setRecruiterContact(e.target.value)}
            placeholder="Navn, email, telefon — auto-udfyldes fra jobopslag hvis muligt"
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`deadline-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Deadline
          </label>
          <input
            id={`deadline-${app.id}`}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`applied-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Applied date
          </label>
          <input
            id={`applied-${app.id}`}
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`followup-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Follow-up date
          </label>
          <input
            id={`followup-${app.id}`}
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="mt-1 field-input-compact"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={`notes-${app.id}`}
          className="text-xs font-medium text-foreground-secondary"
        >
          Notes
        </label>
        <textarea
          id={`notes-${app.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Interview prep, feedback, next steps…"
          className="mt-1 field-input-compact resize-y"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary text-xs px-3 py-1.5"
        >
          Save details
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary text-xs px-3 py-1.5"
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
  const [prepApp, setPrepApp] = useState<Application | null>(null);
  const [loggingJobnet, setLoggingJobnet] = useState<string | null>(null);
  const [autoApplying, setAutoApplying] = useState<string | null>(null);

  const handleAutoApply = async (app: Application) => {
    if (!app.link) return;
    setAutoApplying(app.id);
    try {
      const res = await fetch("/api/agent/auto-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applyUrl: app.link,
          personaId: "default",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Browser opened for review.");
      } else {
        alert(data.error || "Failed to auto-apply");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to start Auto-Apply swarm.");
    } finally {
      setAutoApplying(null);
    }
  };

  const handleJobnetLog = async (app: Application) => {
    setLoggingJobnet(app.id);
    try {
      const res = await fetch("/api/agent/jobnet-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: app.jobTitle,
          company: app.company,
          url: app.link,
          appliedDate: app.appliedDate,
        }),
      });
      if (res.ok) {
        onUpdate(app.id, { jobnetLogged: true, jobnetLoggedDate: new Date().toISOString() });
      } else {
        alert("Jobnet subagent timeout or error. Check terminal.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to run Jobnet subagent.");
    } finally {
      setLoggingJobnet(null);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="glass-panel rounded-xl border-dashed p-10 text-center">
        <p className="text-sm font-medium text-foreground">
          No saved applications yet.
        </p>
        <p className="mt-1 text-sm text-foreground-secondary">
          Analyze a job and save it from the Job Analyzer page.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y text-sm" style={{ borderColor: "var(--surface-border)" }}>
          <caption className="sr-only">
            Saved job applications with match scores, status, and follow-up dates
          </caption>
          <thead style={{ background: "var(--background-secondary)" }}>
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Job Title
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Company
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Location
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Match
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                CV Version
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Cover Letter
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Applied
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Follow-up
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Link
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground-secondary">
                Jobnet
              </th>
              <th className="px-4 py-3 text-right font-semibold text-foreground-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--surface-border)" }}>
            {applications.map((app) => (
              <Fragment key={app.id}>
                <tr className="transition-colors" style={{ cursor: "default" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {app.jobTitle}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">{app.company}</td>
                  <td className="px-4 py-3 text-foreground-secondary">{app.location}</td>
                  <td className="px-4 py-3">
                    <span className="badge-success">
                      {app.matchScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {app.cvVersion ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
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
                      className="field-input-compact text-xs px-2 py-1"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {formatDate(app.appliedDate)}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {formatDate(app.followUpDate)}
                  </td>
                  <td className="px-4 py-3">
                    {app.link ? (
                      <a
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-primary hover:text-primary-dark"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-foreground-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {app.jobnetLogged ? (
                      <span className="badge-success text-[11px]">
                        Logget
                      </span>
                    ) : app.status === "applied" || app.status === "interview" ? (
                      <span className="badge-warning text-[11px]">
                        Mangler
                      </span>
                    ) : (
                      <span className="text-foreground-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPrepApp(app)}
                        className="text-xs font-medium text-primary hover:text-primary-dark"
                      >
                        Prep
                      </button>
                      {app.link && (
                        <button
                          type="button"
                          disabled={autoApplying === app.id}
                          onClick={() => handleAutoApply(app)}
                          className="text-xs font-medium text-primary hover:text-primary-dark disabled:opacity-50 flex items-center gap-1"
                        >
                          {autoApplying === app.id ? (
                            <>
                              <span className="animate-spin">⟳</span>
                              Applying...
                            </>
                          ) : (
                            "Auto-Apply"
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={loggingJobnet === app.id}
                        onClick={() => handleJobnetLog(app)}
                        className="text-xs font-medium text-success hover:opacity-80 disabled:opacity-50 flex items-center gap-1"
                      >
                        {loggingJobnet === app.id ? (
                          <>
                            <span className="animate-spin">⟳</span>
                            Logging...
                          </>
                        ) : (
                          "Jobnet"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === app.id ? null : app.id)
                        }
                        className="text-xs font-medium text-primary hover:text-primary-dark"
                      >
                        {expandedId === app.id ? "Close" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(app.id)}
                        className="text-xs font-medium text-danger hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === app.id && (
                  <tr>
                    <td colSpan={12} className="px-4 py-3">
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
      
      {prepApp && (
        <InterviewPrepModal
          application={prepApp}
          onClose={() => setPrepApp(null)}
        />
      )}
    </div>
  );
}
