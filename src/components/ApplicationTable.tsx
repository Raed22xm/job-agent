"use client";

import { Fragment, useState } from "react";
import ApplicationEditFields from "@/components/ApplicationEditFields";
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
                      <ApplicationEditFields
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
