"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from "react";
import ApplicationTable from "@/components/ApplicationTable";
import ApplicationHeatmap from "@/components/ApplicationHeatmap";
import SkillsGapDashboard from "@/components/SkillsGapDashboard";
import { useJobAgent } from "@/context/JobAgentContext";
import {
  deleteApplication,
  exportApplicationsJson,
  exportApplicationsCsv,
  importApplicationsJson,
  updateApplication,
  updateApplicationStatus,
} from "@/lib/storage";
import { filterApplicationsDueThisWeek, isOverdue } from "@/lib/trackerReminders";
import { filterApplicationsNeedingJobnetLog } from "@/lib/jobnet/trackerJobnet";
import type { ApplicationStatus } from "@/types";

const statusFilterOptions: Array<ApplicationStatus | "all" | "due" | "jobnet"> = [
  "all",
  "due",
  "jobnet",
  "draft",
  "ready",
  "applied",
  "interview",
  "rejected",
  "offer",
];

export default function TrackerPage() {
  const { applications, refreshApplications } = useJobAgent();
  const [statusFilter, setStatusFilter] = useState<
    ApplicationStatus | "all" | "due" | "jobnet"
  >("all");
  const [viewMode, setViewMode] = useState<"table" | "skills">("table");
  const [search, setSearch] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "due") {
      setStatusFilter("due");
    }
    if (params.get("filter") === "jobnet") {
      setStatusFilter("jobnet");
    }
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    const dueSet =
      statusFilter === "due"
        ? new Set(filterApplicationsDueThisWeek(applications).map((a) => a.id))
        : null;
    const jobnetSet =
      statusFilter === "jobnet"
        ? new Set(filterApplicationsNeedingJobnetLog(applications).map((a) => a.id))
        : null;

    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "due"
            ? dueSet!.has(app.id)
            : statusFilter === "jobnet"
              ? jobnetSet!.has(app.id)
            : app.status === statusFilter;
      const matchesSearch =
        !query ||
        app.jobTitle.toLowerCase().includes(query) ||
        app.company.toLowerCase().includes(query) ||
        app.location.toLowerCase().includes(query) ||
        (app.notes?.toLowerCase().includes(query) ?? false);

      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await updateApplicationStatus(id, status);
    await refreshApplications();
  };

  const handleUpdate: ComponentProps<typeof ApplicationTable>["onUpdate"] = async (
    id,
    patch
  ) => {
    await updateApplication(id, patch);
    await refreshApplications();
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this application from the tracker? This cannot be undone unless you have a JSON backup."
    );
    if (!confirmed) return;

    await deleteApplication(id);
    await refreshApplications();
  };

  const handleExport = async () => {
    const json = await exportApplicationsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-agent-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleExportCsv = async () => {
    const csv = await exportApplicationsCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-agent-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const confirmed = window.confirm(
        "Import will replace all saved applications on the server. Continue?"
      );
      if (!confirmed) return;

      await importApplicationsJson(text);
      await refreshApplications();
    } catch {
      setImportError("Could not import tracker backup. Check the JSON file format.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Application Tracker
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Saved on the server in{" "}
            <code className="text-xs">data/applications.sqlite</code>. After each
            application, use <strong className="font-medium">Jobnet</strong> to copy
            fields for your kommune joblog on jobnet.dk.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex rounded-lg border border-border bg-background p-1 mr-2">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table" ? "bg-primary text-white" : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("skills")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "skills" ? "bg-primary text-white" : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Skills Gap
            </button>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={applications.length === 0}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            disabled={applications.length === 0}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-background-secondary"
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
            aria-hidden
          />
        </div>
      </div>

      {importError && (
        <p role="alert" className="text-sm text-danger">
          {importError}
        </p>
      )}

      {/* Stats dashboard */}
      {applications.length > 0 && (() => {
        const applied = applications.filter(a => a.status === "applied" || a.status === "interview" || a.status === "offer").length;
        const interviews = applications.filter(a => a.status === "interview").length;
        const offers = applications.filter(a => a.status === "offer").length;
        const rejected = applications.filter(a => a.status === "rejected").length;
        const avgScore = applications.length > 0
          ? Math.round(applications.reduce((s, a) => s + (a.matchScore ?? 0), 0) / applications.length)
          : 0;
        const overdue = applications.filter(a =>
          isOverdue(a.deadline) || isOverdue(a.followUpDate)
        ).length;
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[
              { label: "Total", value: applications.length, color: "slate" },
              { label: "Applied", value: applied, color: "blue" },
              { label: "Interviews", value: interviews, color: "emerald" },
              { label: "Offers", value: offers, color: "violet" },
              { label: "Rejected", value: rejected, color: "rose" },
              { label: "Avg Match", value: `${avgScore}%`, color: overdue > 0 ? "amber" : "slate" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-border bg-surface px-4 py-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground-secondary mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        );
      })()}
      
      {/* Persona A/B Analytics */}
      {applications.length > 0 && (() => {
        // Group by personaIdUsed
        const personaStats: Record<string, { total: number; interviews: number }> = {};
        
        for (const app of applications) {
          const pId = app.personaIdUsed || "default";
          if (!personaStats[pId]) personaStats[pId] = { total: 0, interviews: 0 };
          
          if (["applied", "interview", "rejected", "offer"].includes(app.status)) {
            personaStats[pId].total += 1;
            if (["interview", "offer"].includes(app.status)) {
              personaStats[pId].interviews += 1;
            }
          }
        }

        const entries = Object.entries(personaStats).filter(([_, stats]) => stats.total > 0);
        if (entries.length === 0) return null;

        return (
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-3">CV A/B Testing Analytics</h2>
            <div className="space-y-3">
              {entries.map(([pId, stats]) => {
                const conversion = Math.round((stats.interviews / stats.total) * 100);
                return (
                  <div key={pId} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary">Persona: {pId}</p>
                      <p className="text-xs text-foreground-secondary">{stats.interviews} interviews / {stats.total} applied</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-background-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${conversion}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-foreground w-12 text-right">{conversion}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {applications.length > 0 && (() => {
        const overdue = applications.filter(a =>
          isOverdue(a.deadline) || isOverdue(a.followUpDate)
        ).length;
        return overdue > 0 ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-2 text-xs font-medium text-danger">
            ⚠️ {overdue} application{overdue > 1 ? "s" : ""} overdue — check your deadlines
          </div>
        ) : null;
      })()}

      <ApplicationHeatmap applications={applications} />

      {viewMode === "table" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="tracker-search"
                className="text-sm font-medium text-foreground-secondary"
              >
                Search
              </label>
              <input
                id="tracker-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, company, location, or notes"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="tracker-status"
                className="text-sm font-medium text-foreground-secondary"
              >
                Status
              </label>
              <select
                id="tracker-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ApplicationStatus | "all" | "due" | "jobnet")
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none ring-primary focus:ring-2 sm:w-44"
              >
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All statuses"
                      : status === "due"
                        ? "Due this week"
                        : status === "jobnet"
                          ? "Needs Jobnet log"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ApplicationTable
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </>
      ) : (
        <SkillsGapDashboard applications={applications} />
      )}
    </div>
  );
}
