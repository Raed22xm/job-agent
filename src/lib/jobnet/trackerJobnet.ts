import type { Application } from "@/types";

/** Applied or in interview, but not yet marked as logged on jobnet.dk */
export function filterApplicationsNeedingJobnetLog(
  applications: Application[]
): Application[] {
  return applications.filter(
    (app) =>
      (app.status === "applied" || app.status === "interview") &&
      !app.jobnetLogged
  );
}
