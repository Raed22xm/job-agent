"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from "react";
import ApplicationTable from "@/components/ApplicationTable";
import { useJobAgent } from "@/context/JobAgentContext";
import {
  deleteApplication,
  exportApplicationsJson,
  importApplicationsJson,
  updateApplication,
  updateApplicationStatus,
} from "@/lib/storage";
import { filterApplicationsDueThisWeek } from "@/lib/trackerReminders";
import type { ApplicationStatus } from "@/types";

const statusFilterOptions: Array<ApplicationStatus | "all" | "due"> = [
  "all",
  "due",
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
    ApplicationStatus | "all" | "due"
  >("all");
  const [search, setSearch] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "due") {
      setStatusFilter("due");
    }
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    const dueSet =
      statusFilter === "due"
        ? new Set(filterApplicationsDueThisWeek(applications).map((a) => a.id))
        : null;

    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "due"
            ? dueSet!.has(app.id)
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

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateApplicationStatus(id, status);
    refreshApplications();
  };

  const handleUpdate: ComponentProps<typeof ApplicationTable>["onUpdate"] = (
    id,
    patch
  ) => {
    updateApplication(id, patch);
    refreshApplications();
  };

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Delete this application from the local tracker? This cannot be undone unless you have a JSON backup."
    );
    if (!confirmed) return;

    deleteApplication(id);
    refreshApplications();
  };

  const handleExport = () => {
    const blob = new Blob([exportApplicationsJson()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-agent-tracker-${new Date().toISOString().slice(0, 10)}.json`;
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
        "Import will replace all saved applications in this browser. Continue?"
      );
      if (!confirmed) return;

      importApplicationsJson(text);
      refreshApplications();
    } catch {
      setImportError("Could not import tracker backup. Check the JSON file format.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Application Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Saved locally in your browser. Export a JSON backup before clearing
            site data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={applications.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
        <p role="alert" className="text-sm text-rose-600">
          {importError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="tracker-search"
            className="text-sm font-medium text-slate-700"
          >
            Search
          </label>
          <input
            id="tracker-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, location, or notes"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor="tracker-status"
            className="text-sm font-medium text-slate-700"
          >
            Status
          </label>
          <select
            id="tracker-status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ApplicationStatus | "all" | "due")
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 sm:w-44"
          >
            {statusFilterOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? "All statuses"
                  : status === "due"
                    ? "Due this week"
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
    </div>
  );
}
