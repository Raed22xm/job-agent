"use client";

import { useMemo, useState } from "react";
import ApplicationTable from "@/components/ApplicationTable";
import { useJobAgent } from "@/context/JobAgentContext";
import { deleteApplication, updateApplicationStatus } from "@/lib/storage";
import type { ApplicationStatus } from "@/types";

const statusFilterOptions: Array<ApplicationStatus | "all"> = [
  "all",
  "draft",
  "ready",
  "applied",
  "interview",
  "rejected",
  "offer",
];

export default function TrackerPage() {
  const { applications, refreshApplications } = useJobAgent();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all"
  );
  const [search, setSearch] = useState("");

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "all" ? true : app.status === statusFilter;
      const matchesSearch =
        !query ||
        app.jobTitle.toLowerCase().includes(query) ||
        app.company.toLowerCase().includes(query) ||
        app.location.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateApplicationStatus(id, status);
    refreshApplications();
  };

  const handleDelete = (id: string) => {
    deleteApplication(id);
    refreshApplications();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
        <p className="mt-1 text-sm text-slate-600">
          Saved locally in your browser. SQLite persistence will be added later.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="tracker-search" className="text-sm font-medium text-slate-700">
            Search
          </label>
          <input
            id="tracker-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, or location"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="tracker-status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="tracker-status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ApplicationStatus | "all")
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 sm:w-44"
          >
            {statusFilterOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? "All statuses"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ApplicationTable
        applications={filteredApplications}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
