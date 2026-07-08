"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JobnetLogPanel from "@/components/JobnetLogPanel";
import { useJobAgent } from "@/context/JobAgentContext";
import {
  applicationIdentity,
  buildDraftApplicationFromSession,
  findMatchingApplication,
  mergeApplicationWithSession,
  resolveJobnetSelection,
  SESSION_CURRENT_ID,
} from "@/lib/jobnet/sessionApplication";
import { enrichApplicationWithJobMeta } from "@/lib/jobnet/enrichApplicationMeta";
import { filterApplicationsNeedingJobnetLog } from "@/lib/jobnet/trackerJobnet";
import { updateApplication } from "@/lib/storage";
import type { Application } from "@/types";

export default function JobnetPage() {
  const {
    applications,
    parsedJob,
    matchResult,
    generatedCV,
    generatedCoverLetter,
    refreshApplications,
    saveToTracker,
  } = useJobAgent();

  const [selectedId, setSelectedId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const userPickedRef = useRef(false);
  const lastSessionIdentityRef = useRef<string | null>(null);

  const sessionDraft = useMemo(() => {
    if (!parsedJob || !matchResult) return null;
    return buildDraftApplicationFromSession(parsedJob, matchResult, {
      generatedCV,
      generatedCoverLetter,
    });
  }, [parsedJob, matchResult, generatedCV, generatedCoverLetter]);

  const matchingSaved = useMemo(
    () => (parsedJob ? findMatchingApplication(applications, parsedJob) : undefined),
    [applications, parsedJob]
  );

  const sessionIdentity = parsedJob ? applicationIdentity(parsedJob) : null;

  const selectableApplications = useMemo(() => {
    const list = [...applications];
    if (sessionDraft && !matchingSaved) {
      list.unshift(sessionDraft);
    }
    return list;
  }, [applications, sessionDraft, matchingSaved]);

  const selected = useMemo(() => {
    if (selectedId === SESSION_CURRENT_ID) return sessionDraft;
    const app = applications.find((item) => item.id === selectedId);
    if (!app || !parsedJob || !matchResult) return app ?? null;

    if (
      matchingSaved?.id === app.id &&
      applicationIdentity(parsedJob) === applicationIdentity(app.job)
    ) {
      return mergeApplicationWithSession(app, parsedJob, matchResult, {
        generatedCV,
        generatedCoverLetter,
      });
    }

    return enrichApplicationWithJobMeta(app);
  }, [
    applications,
    selectedId,
    sessionDraft,
    parsedJob,
    matchResult,
    matchingSaved?.id,
    generatedCV,
    generatedCoverLetter,
  ]);

  const applySelection = useCallback((id: string, fromUser = false) => {
    if (fromUser) userPickedRef.current = true;
    setSelectedId(id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get("app");
    if (appParam) {
      applySelection(
        resolveJobnetSelection(applications, parsedJob, matchResult, appParam)
      );
      return;
    }

    if (!selectedId) {
      applySelection(
        resolveJobnetSelection(applications, parsedJob, matchResult)
      );
    }
  }, [applications, parsedJob, matchResult, selectedId, applySelection]);

  useEffect(() => {
    if (!sessionIdentity) return;
    if (sessionIdentity === lastSessionIdentityRef.current) return;

    lastSessionIdentityRef.current = sessionIdentity;
    userPickedRef.current = false;
    setSelectedId(matchingSaved?.id ?? SESSION_CURRENT_ID);
  }, [sessionIdentity, matchingSaved?.id]);

  const needingCount = filterApplicationsNeedingJobnetLog(applications).length;

  const handleMarkLogged = async (
    application: Application,
    logged: boolean,
    loggedDate?: string
  ) => {
    if (application.id === SESSION_CURRENT_ID) {
      const saved = await saveToTracker();
      if (!saved) return;
      await updateApplication(saved.id, {
        jobnetLogged: logged,
        jobnetLoggedDate: loggedDate,
      });
      await refreshApplications();
      setSelectedId(saved.id);
      return;
    }

    await updateApplication(application.id, {
      jobnetLogged: logged,
      jobnetLoggedDate: loggedDate,
    });
    await refreshApplications();
  };

  const handleSaveToTracker = async () => {
    setSaving(true);
    try {
      const saved = await saveToTracker();
      if (saved) {
        userPickedRef.current = false;
        setSelectedId(saved.id);
        await refreshApplications();
      }
    } finally {
      setSaving(false);
    }
  };

  const isSessionOnly = selected?.id === SESSION_CURRENT_ID;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobnet joblog</h1>
          <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
            Bruger dit <strong>aktuelle job</strong> fra Job Analyzer når du
            analyserer nyt — kopiér felterne ind på{" "}
            <a
              href="https://www.jobnet.dk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-success underline"
            >
              jobnet.dk
            </a>
            .
          </p>
        </div>
        <a
          href="https://www.jobnet.dk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Åbn Jobnet → Joblog
        </a>
      </div>

      {sessionDraft && (
        <section className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <p className="text-sm font-medium text-primary-dark">
            Aktuelt job: {parsedJob?.title} · {parsedJob?.company}
          </p>
          <p className="mt-1 text-xs text-primary-dark/90">
            {matchingSaved
              ? "Matcher en gemt ansøgning i tracker — felterne opdateres fra den nyeste analyse."
              : "Ikke gemt i tracker endnu — vises som kladde her."}
          </p>
          {!matchingSaved && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveToTracker()}
              className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? "Gemmer…" : "Gem i tracker"}
            </button>
          )}
        </section>
      )}

      {applications.length === 0 && !sessionDraft ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-medium text-foreground-secondary">
            Ingen job endnu.
          </p>
          <p className="mt-1 text-sm text-foreground-secondary">
            Analysér et job først — så opdateres Jobnet-felterne automatisk.
          </p>
          <Link
            href="/analyzer"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Gå til Job Analyzer
          </Link>
        </div>
      ) : (
        <>
          <div className="max-w-xl">
            <label
              htmlFor="jobnet-application"
              className="text-sm font-medium text-foreground-secondary"
            >
              Vælg job
            </label>
            <select
              id="jobnet-application"
              value={selectedId}
              onChange={(e) => applySelection(e.target.value, true)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
            >
              {selectableApplications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.id === SESSION_CURRENT_ID ? "★ " : ""}
                  {app.jobTitle} · {app.company}
                  {app.id === SESSION_CURRENT_ID ? " (aktuelt)" : ""}
                  {app.jobnetLogged ? " ✓ logget" : ""}
                </option>
              ))}
            </select>
            {needingCount > 0 && (
              <p className="mt-2 text-xs text-warning">
                {needingCount} gemt job mangler joblog på Jobnet.
              </p>
            )}
          </div>

          {selected && (
            <JobnetLogPanel
              key={selected.id + selected.updatedAt + applicationIdentity(selected.job)}
              application={selected}
              jobnetLogged={isSessionOnly ? false : selected.jobnetLogged}
              jobnetLoggedDate={
                isSessionOnly ? undefined : selected.jobnetLoggedDate
              }
              onMarkLogged={(logged, loggedDate) =>
                void handleMarkLogged(selected, logged, loggedDate)
              }
            />
          )}
        </>
      )}
    </div>
  );
}
