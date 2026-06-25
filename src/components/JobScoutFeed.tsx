"use client";

import { useState } from "react";
import type { ScoutedJob } from "@/lib/agent/jobScout";
import type { OutreachDraft } from "@/app/api/agent/outreach/route";

interface JobScoutFeedProps {
  jobs: ScoutedJob[];
  query: string;
  hasAdzuna: boolean;
  totalFound: number;
  dkCount?: number;
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{job.title}</p>
            <p className="text-brand-200 text-sm">{job.company}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!draft && (
            <div className="text-center py-4">
              <p className="text-slate-600 text-sm mb-4">
                Generate a tailored LinkedIn note and cold email using your verified CV data.
              </p>
              <button
                onClick={generate}
                disabled={loading}
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
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
                <p className="text-xs font-medium text-slate-600 mb-2">Subject: {draft.emailSubject}</p>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{draft.emailBody}</pre>
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

  // Split by source type
  const dtuJobs = jobs.filter((j) => j.source === "dtu");
  const jobnetPortalJobs = jobs.filter((j) => j.source === "jobnet-portal");
  const regularJobs = jobs.filter((j) => j.source !== "dtu" && j.source !== "jobnet-portal");

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-slate-600 text-sm">No jobs found for &quot;{query}&quot;</p>
        <p className="text-slate-400 text-xs mt-1">Try a different search term above</p>
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
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{regularJobs.length} live jobs found</span>
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
          <span>·</span>
          <span className="truncate max-w-xs">Query: &quot;{query}&quot;</span>
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
                    <p className="text-sm font-medium text-emerald-900 truncate">
                      {job.title.replace("Jobnet.dk — ", "")}
                    </p>
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
                {job.description && (
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <a
                  href={`/analyzer?job=${encodeURIComponent(`${job.title} at ${job.company}\n${job.description ?? ""}`)}`}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors text-center whitespace-nowrap"
                >
                  Analyze fit
                </a>
                <button
                  onClick={() => setActiveJob(job)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  ✉ Outreach
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
