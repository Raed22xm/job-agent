"use client";

import { useState } from "react";
import type { ScoutedJob } from "@/lib/agent/jobScout";
import type { OutreachDraft } from "@/app/api/agent/outreach/route";
import type { Application } from "@/types";

interface JobScoutFeedProps {
  jobs: ScoutedJob[];
  query: string;
  hasAdzuna: boolean;
  totalFound: number;
  dkCount?: number;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const sourceColors: Record<string, string> = {
  remoteok: "bg-purple-100 text-purple-700",
  adzuna: "bg-blue-100 text-blue-700",
  jobnet: "bg-red-100 text-red-700",
  "jobnet-portal": "bg-emerald-100 text-emerald-700",
  jobindex: "bg-rose-100 text-rose-700",
  dtu: "bg-indigo-100 text-indigo-700",
};

const sourceLabels: Record<string, string> = {
  remoteok: "RemoteOK",
  adzuna: "Adzuna",
  jobnet: "🇩🇰 Jobnet API",
  "jobnet-portal": "🇩🇰 Jobnet.dk",
  jobindex: "🇩🇰 Jobindex.dk",
  dtu: "🎓 DTU Career Hub",
};

const matchColor = (score?: number) => {
  if (!score) return "text-slate-400";
  if (score >= 70) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-rose-500";
};

interface OutreachModalProps {
  job: ScoutedJob;
  onClose: () => void;
}

function OutreachModal({ job, onClose }: OutreachModalProps) {
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          tags: job.tags,
        }),
      });
      const data = await res.json();
      setDraft(data.draft);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendEmail = async () => {
    if (!draft || !recruiterEmail) return;
    setSendingEmail(true);
    setEmailStatus("idle");
    try {
      const res = await fetch("/api/agent/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recruiterEmail,
          subject: draft.emailSubject,
          text: draft.emailBody,
        }),
      });
      if (res.ok) {
        setEmailStatus("success");
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl bg-background shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground font-semibold">{job.title}</p>
            <p className="text-primary-foreground/80 text-sm">{job.company}</p>
          </div>
          <button onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!draft && (
            <div className="text-center py-4">
              <p className="text-foreground-secondary text-sm mb-4">
                Generate a tailored LinkedIn note and cold email using your verified CV data.
              </p>
              <button
                onClick={generate}
                disabled={loading}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Generating…" : "✉ Generate Outreach"}
              </button>
            </div>
          )}

          {draft && (
            <div className="space-y-4">
              {/* LinkedIn Note */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">LinkedIn Note</p>
                  <button
                    onClick={() => copy(draft.linkedinNote, "li")}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {copied === "li" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{draft.linkedinNote}</p>
                <p className="text-xs text-slate-400 mt-1">{draft.linkedinNote.length}/300 chars</p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cold Email</p>
                  <button
                    onClick={() => copy(`Subject: ${draft.emailSubject}\n\n${draft.emailBody}`, "email")}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {copied === "email" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs font-medium text-foreground-secondary mb-2">Subject: {draft.emailSubject}</p>
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed mb-4">{draft.emailBody}</pre>
                
                <div className="border-t border-border pt-3 mt-3 flex items-center gap-2">
                  <input
                    type="email"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm outline-none ring-primary focus:ring-2 bg-background text-foreground"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !recruiterEmail}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sendingEmail ? "Sending…" : "Send"}
                  </button>
                </div>
                {emailStatus === "success" && <p className="text-xs text-emerald-600 mt-1">✓ Sent successfully</p>}
                {emailStatus === "error" && <p className="text-xs text-rose-600 mt-1">✗ Failed to send. Check SMTP in .env</p>}
              </div>

              {/* Follow-up */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Follow-up (1 week)</p>
                  <button
                    onClick={() => copy(draft.followUpMessage, "fu")}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {copied === "fu" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{draft.followUpMessage}</p>
              </div>

              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Full Job Posting ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobScoutFeed({ jobs, query, hasAdzuna, totalFound, dkCount }: JobScoutFeedProps) {
  const [activeJob, setActiveJob] = useState<ScoutedJob | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  const handleSave = async (job: ScoutedJob) => {
    setSaveStates((p) => ({ ...p, [job.id]: "saving" }));
    try {
      const app: Partial<Application> = {
        id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        company: job.company,
        jobTitle: job.title,
        location: job.location,
        link: job.url,
        matchScore: job.matchScore ?? 0,
        status: "draft",
        coverLetterStatus: "none",
        job: { title: job.title, company: job.company, location: job.location,
               responsibilities: [], requirements: [], tools: job.tags,
               skills: job.tags, atsKeywords: [], rawText: job.description ?? "",
               sourceUrl: job.url },
        match: { score: job.matchScore ?? 0, matchedKeywords: job.tags,
                 missingKeywords: [], recommendedFocusAreas: [], summary: "" },
      };
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application: app }),
      });
      setSaveStates((p) => ({ ...p, [job.id]: res.ok ? "saved" : "error" }));
    } catch {
      setSaveStates((p) => ({ ...p, [job.id]: "error" }));
    }
  };

  // Split by source type
  const dtuJobs = jobs.filter((j) => j.source === "dtu");
  const jobnetPortalJobs = jobs.filter((j) => j.source === "jobnet-portal");
  const regularJobs = jobs.filter((j) => j.source !== "dtu" && j.source !== "jobnet-portal");

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background-secondary p-8 text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-foreground-secondary text-sm">No jobs found for &quot;{query}&quot;</p>
        <p className="text-foreground-tertiary text-xs mt-1">Try a different search term above</p>
      </div>
    );
  }

  return (
    <>
      {activeJob && (
        <OutreachModal job={activeJob} onClose={() => setActiveJob(null)} />
      )}

      <div className="space-y-4">
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-secondary">
          <span className="font-medium text-foreground">{regularJobs.length} live jobs found</span>
          {dkCount !== undefined && dkCount > 0 && (
            <span className="rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-xs font-medium">
              🇩🇰 {dkCount} from Denmark
            </span>
          )}
          {jobnetPortalJobs.length > 0 && (
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium">
              🇩🇰 Jobnet.dk
            </span>
          )}
          {dtuJobs.length > 0 && (
            <span className="rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5 text-xs font-medium">
              🎓 DTU Career Hub
            </span>
          )}
          <span className="text-foreground-tertiary">·</span>
          <span className="truncate max-w-xs text-foreground-secondary">Query: &quot;{query}&quot;</span>
          {!hasAdzuna && (
            <span className="ml-auto text-xs bg-amber-50 text-amber-600 rounded-full px-2 py-0.5">
              Add ADZUNA_APP_ID/KEY for Adzuna DK results
            </span>
          )}
        </div>

        {/* Jobnet.dk public portal section */}
        {jobnetPortalJobs.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-200">
              <span className="text-xl">🇩🇰</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-900">Jobnet.dk — Danmarks officielle jobportal</p>
                <p className="text-xs text-emerald-700">
                  Drevet af STAR · Åbent for alle — <strong>intet login påkrævet</strong>
                </p>
              </div>
              <a
                href="https://www.jobnet.dk"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Åbn portal ↗
              </a>
            </div>
            <div className="divide-y divide-emerald-100">
              {jobnetPortalJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-100/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-lg text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {job.title.replace("Jobnet.dk — ", "")}
                    </a>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {job.tags.slice(1).map((tag) => (
                        <span key={tag} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                  >
                    Søg ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DTU Career Hub section */}
        {dtuJobs.length > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-indigo-200">
              <span className="text-xl">🎓</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-900">DTU Career Hub</p>
                <p className="text-xs text-indigo-600">
                  Requires DTU student or alumni login (JobTeaser) — no public API
                </p>
              </div>
              <a
                href="https://careerhub.dtu.dk"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Open portal ↗
              </a>
            </div>
            <div className="divide-y divide-indigo-100">
              {dtuJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-100/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-900 truncate">
                      {job.title.replace("DTU Career Hub — ", "")}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {job.tags.slice(1).map((tag) => (
                        <span key={tag} className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                  >
                    Search ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular job cards */}
        {regularJobs.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-200 hover:shadow-md transition-all"
          >
            <div className="flex flex-wrap items-start gap-3 justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm">{job.title}</h3>
                  {job.matchScore !== undefined && (
                    <span className={`text-xs font-bold ${matchColor(job.matchScore)}`}>
                      {job.matchScore}% match
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{job.company}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs text-slate-500">📍 {job.location}</span>
                  {job.salary && (
                    <span className="text-xs text-emerald-600">💰 {job.salary}</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceColors[job.source] ?? "bg-slate-100 text-slate-600"}`}>
                    {sourceLabels[job.source] ?? job.source}
                  </span>
                  {job.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
                {job.scoreBreakdown && (
                  <details className="mt-2 text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-700 font-medium list-none flex items-center gap-1">
                      <span className="text-[10px]">▼</span> Score breakdown
                    </summary>
                    <div className="pl-3 mt-1.5 space-y-1 border-l border-slate-200">
                      <div className="flex justify-between max-w-[200px]">
                        <span>Skills match:</span>
                        <span className="font-medium text-slate-700">{Math.round(job.scoreBreakdown.skillsMatch.score)}/{job.scoreBreakdown.skillsMatch.weight}</span>
                      </div>
                      <div className="flex justify-between max-w-[200px]">
                        <span>Experience overlap:</span>
                        <span className="font-medium text-slate-700">{Math.round(job.scoreBreakdown.experienceMatch.score)}/{job.scoreBreakdown.experienceMatch.weight}</span>
                      </div>
                      <div className="flex justify-between max-w-[200px]">
                        <span>Location/Remote:</span>
                        <span className="font-medium text-slate-700">{Math.round(job.scoreBreakdown.location.score)}/{job.scoreBreakdown.location.weight}</span>
                      </div>
                      <div className="flex justify-between max-w-[200px]">
                        <span>Language reqs:</span>
                        <span className="font-medium text-slate-700">{Math.round(job.scoreBreakdown.language.score)}/{job.scoreBreakdown.language.weight}</span>
                      </div>
                    </div>
                  </details>
                )}
                {job.description && (
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <a
                  href={`/analyzer?job=${encodeURIComponent(`${job.title} at ${job.company}\n${job.description ?? ""}`)}`}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors text-center whitespace-nowrap"
                >
                  Analyze fit
                </a>
                <button
                  onClick={() => setActiveJob(job)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background-secondary transition-colors whitespace-nowrap"
                >
                  ✉ Outreach
                </button>
                <button
                  onClick={() => void handleSave(job)}
                  disabled={saveStates[job.id] === "saving" || saveStates[job.id] === "saved"}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    saveStates[job.id] === "saved"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : saveStates[job.id] === "error"
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "border border-border text-foreground hover:bg-background-secondary"
                  }`}
                >
                  {saveStates[job.id] === "saving" ? "Saving…" :
                   saveStates[job.id] === "saved" ? "✓ Saved" :
                   saveStates[job.id] === "error" ? "Failed" : "💾 Save"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
