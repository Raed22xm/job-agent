"use client";

import ApplicationTable from "@/components/ApplicationTable";
import { useJobAgent } from "@/context/JobAgentContext";
import {
  deleteApplication,
  getApplications,
  updateApplicationStatus,
} from "@/lib/storage";
import type { ApplicationStatus } from "@/types";

export default function TrackerPage() {
  const { applications, refreshApplications } = useJobAgent();

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateApplicationStatus(id, status);
    refreshApplications();
  };

  const handleDelete = (id: string) => {
    deleteApplication(id);
    refreshApplications();
  };

  const syncedApplications = applications.length ? applications : getApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
        <p className="mt-1 text-sm text-slate-600">
          Saved locally in your browser. SQLite persistence will be added later.
        </p>
      </div>

      <ApplicationTable
        applications={syncedApplications}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
