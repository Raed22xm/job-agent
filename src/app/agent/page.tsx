"use client";

import { useState } from "react";
import AgentStreamLog, { type LogEntry } from "@/components/AgentStreamLog";
import CVAuditReport from "@/components/CVAuditReport";
import JobScoutFeed from "@/components/JobScoutFeed";
import type { CVAuditResult } from "@/lib/agent/cvAudit";
import type { ScoutedJob } from "@/lib/agent/jobScout";

type Tab = "audit" | "scout" | "plan";

interface ScoutResult {
  jobs: ScoutedJob[];
  query: string;
  totalFound: number;
  hasAdzuna: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function AgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("audit");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [auditResult, setAuditResult] = useState<CVAuditResult | null>(null);
  const [auditMode, setAuditMode] = useState("local");

  const [scoutResult, setScoutResult] = useState<ScoutResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message }]);
  };

  // ── CV Audit ──────────────────────────────────────────────────────────────
  const runCVAudit = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("info", "Loading your master CV…");
    await sleep(400);
    addLog("thinking", "Auditing professional summary…");
    await sleep(600);
    addLog("thinking", "Scoring experience bullet points…");
    await sleep(500);
    addLog("thinking", "Checking ATS compatibility…");
    await sleep(400);

    try {
      const res = await fetch("/api/agent/cv-audit", { method: "POST" });
      const data = await res.json();
      setAuditResult(data.result);
      setAuditMode(data.mode);
      addLog("success", `CV audit complete — Grade ${data.result.grade} (${data.result.overallScore}/100)`);
      addLog(
        data.result.overallScore >= 70 ? "success" : "info",
        `ATS Risk: ${data.result.atsRisk} · ${data.result.sections.length} sections reviewed`
      );
    } catch {
      addLog("error", "CV audit failed — check your setup");
    } finally {
      setIsRunning(false);
    }
  };

  // ── Job Scout ─────────────────────────────────────────────────────────────
  const runJobScout = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("info", "Reading your CV profile…");
    await sleep(400);
    addLog("thinking", "Searching RemoteOK for matching roles…");
    await sleep(700);
    if (process.env.NEXT_PUBLIC_HAS_ADZUNA !== "false") {
      addLog("thinking", "Querying Adzuna job board…");
      await sleep(500);
    }
    addLog("thinking", "Scoring each job against your CV…");

    try {
      const res = await fetch("/api/agent/job-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim() || undefined,
          location: searchLocation.trim() || undefined,
        }),
      });
      const data = await res.json();
      setScoutResult(data);
      addLog("success", `Found ${data.totalFound} jobs · ranked by CV match score`);
      const top = data.jobs[0];
      if (top) {
        addLog("info", `Top match: "${top.title}" at ${top.company} (${top.matchScore ?? "?"}%)`);
      }
    } catch {
      addLog("error", "Job search failed — check your internet connection");
    } finally {
      setIsRunning(false);
    }
  };

  // ── Run All ───────────────────────────────────────────────────────────────
  const runAll = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("info", "Starting full job search pipeline…");
    await sleep(300);

    // Step 1 – CV Audit
    setActiveTab("audit");
    addLog("thinking", "Step 1/2: CV Audit");
    await sleep(400);
    try {
      const auditRes = await fetch("/api/agent/cv-audit", { method: "POST" });
      const auditData = await auditRes.json();
      setAuditResult(auditData.result);
      setAuditMode(auditData.mode);
      addLog("success", `CV audit done — Grade ${auditData.result.grade}`);
    } catch {
      addLog("error", "CV audit failed — continuing…");
    }

    await sleep(500);

    // Step 2 – Job Scout
    setActiveTab("scout");
    addLog("thinking", "Step 2/2: Searching for matching jobs…");
    await sleep(400);
    try {
      const scoutRes = await fetch("/api/agent/job-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const scoutData = await scoutRes.json();
      setScoutResult(scoutData);
      addLog("success", `Found ${scoutData.totalFound} jobs for you`);
    } catch {
      addLog("error", "Job search failed");
    }

    addLog("success", "Pipeline complete — review your results in each tab!");
    setIsRunning(false);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "audit", label: "CV Doctor", icon: "🩺" },
    { id: "scout", label: "Job Scout", icon: "🔍" },
    { id: "plan", label: "Action Plan", icon: "📋" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          AI Agent · Level 2 — You review every output
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Job Search Agent
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Your autonomous job search partner. Audits your CV, hunts live
          job listings ranked by your match score, and drafts personalised
          outreach — you review and approve everything before acting.
        </p>
      </header>

      {/* Run buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={runAll}
          disabled={isRunning}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isRunning ? "Agent running…" : "▶ Run Full Pipeline"}
        </button>
        <button
          onClick={() => { setActiveTab("audit"); runCVAudit(); }}
          disabled={isRunning}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          🩺 Audit CV only
        </button>
        <button
          onClick={() => { setActiveTab("scout"); runJobScout(); }}
          disabled={isRunning}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          🔍 Search jobs only
        </button>
      </div>

      {/* Stream log */}
      <AgentStreamLog entries={logs} isRunning={isRunning} />

      {/* Tabs */}
      <div>
        <nav className="flex gap-1 border-b border-slate-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* CV Doctor tab */}
        {activeTab === "audit" && (
          <div>
            {!auditResult && !isRunning && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-4xl mb-3">🩺</p>
                <p className="text-slate-600 font-medium">CV Doctor ready</p>
                <p className="text-slate-400 text-sm mt-1 mb-4">
                  Scores every section of your CV and gives ranked, actionable improvements
                </p>
                <button
                  onClick={runCVAudit}
                  className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Audit my CV
                </button>
              </div>
            )}
            {auditResult && (
              <CVAuditReport result={auditResult} mode={auditMode} />
            )}
          </div>
        )}

        {/* Job Scout tab */}
        {activeTab === "scout" && (
          <div className="space-y-4">
            {/* Search override form */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Role / keywords (optional — inferred from CV if blank)
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Frontend developer React"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="w-48">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="e.g. London, Remote"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <button
                onClick={runJobScout}
                disabled={isRunning}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {isRunning ? "Searching…" : "Search"}
              </button>
            </div>

            {!scoutResult && !isRunning && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-slate-600 font-medium">Job Scout ready</p>
                <p className="text-slate-400 text-sm mt-1">
                  Searches RemoteOK + Adzuna and scores each job against your CV
                </p>
              </div>
            )}

            {scoutResult && (
              <JobScoutFeed
                jobs={scoutResult.jobs}
                query={scoutResult.query}
                totalFound={scoutResult.totalFound}
                hasAdzuna={scoutResult.hasAdzuna}
              />
            )}
          </div>
        )}

        {/* Action Plan tab */}
        {activeTab === "plan" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Your Weekly Action Plan</h2>
              <div className="space-y-3">
                {[
                  { day: "Mon", task: "Run CV Doctor → apply top 3 improvements", icon: "🩺" },
                  { day: "Tue", task: "Run Job Scout → pick 5 target roles", icon: "🔍" },
                  { day: "Wed", task: "Use Analyzer on each job → generate tailored CVs", icon: "📊" },
                  { day: "Thu", task: "Draft outreach messages for hiring managers", icon: "✉" },
                  { day: "Fri", task: "Send applications + update tracker", icon: "✓" },
                  { day: "Next week", task: "Send follow-up messages (1 week rule)", icon: "🔁" },
                ].map((item) => (
                  <div
                    key={item.day}
                    className="flex items-start gap-3 rounded-lg bg-slate-50 p-3"
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-brand-600 uppercase tracking-wide">{item.day}</span>
                      <p className="text-sm text-slate-700">{item.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">Important rules</p>
              <ul className="space-y-1 text-xs text-amber-800 list-disc pl-4">
                <li>Never apply without reviewing the generated CV and cover letter first</li>
                <li>All outputs use only verified facts from your master CV</li>
                <li>Outreach messages are drafts — personalise before sending</li>
                <li>Add Adzuna API keys to .env for broader job search coverage</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
