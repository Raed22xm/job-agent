"use client";

import { useEffect, useState } from "react";
import AgentStreamLog, { type LogEntry } from "@/components/AgentStreamLog";
import CVAuditReport from "@/components/CVAuditReport";
import JobScoutFeed from "@/components/JobScoutFeed";
import GeoAuditReport from "@/components/GeoAuditReport";
import type { CVAuditResult } from "@/lib/agent/cvAudit";
import type { ScoutedJob } from "@/lib/agent/jobScout";
import type { GeoAuditResult } from "@/lib/agent/geoAudit";

type Tab = "audit" | "scout" | "geo" | "plan";
type Market = "remote" | "dk" | "global";

interface ScoutResult {
  jobs: ScoutedJob[];
  query: string;
  totalFound: number;
  hasAdzuna: boolean;
  dkCount?: number;
  markets: Market[];
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
  const [selectedMarkets, setSelectedMarkets] = useState<Market[]>(["remote", "dk"]);

  const [geoResult, setGeoResult] = useState<GeoAuditResult | null>(null);
  const [pipelineStep, setPipelineStep] = useState<0 | 1 | 2 | 3>(0);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);

  const runGithubSync = async () => {
    setIsSyncingGithub(true);
    addLog("info", "🐙 Connecting to GitHub API to sync recent activity...");
    try {
      const res = await fetch("/api/agent/github-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "octocat" }) // Default for demo
      });
      const data = await res.json();
      if (res.ok) {
        addLog("success", `🐙 ${data.message}`);
      } else {
        addLog("error", `🐙 GitHub Sync failed: ${data.error}`);
      }
    } catch (e: any) {
      addLog("error", `🐙 GitHub Sync failed: ${e.message}`);
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // Read ?location= param from URL (set by Geo Audit card links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get("location");
    if (loc) setSearchLocation(loc);
  }, []);

  // Keyboard shortcut: Ctrl+R / Cmd+R → Run Full Pipeline
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "r" && !isRunning) {
        e.preventDefault();
        void runAll();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const toggleMarket = (m: Market) => {
    setSelectedMarkets((prev) =>
      prev.includes(m)
        ? prev.length > 1 ? prev.filter((x) => x !== m) : prev // always keep at least 1
        : [...prev, m]
    );
  };

  const addLog = (type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message }]);
  };

  // ── Geo Audit ─────────────────────────────────────────────────────────────
  const runGeoAudit = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("info", "🗺️ Starting geographic market audit…");
    await sleep(300);
    addLog("thinking", "Scoring Copenhagen job market against your CV…");
    await sleep(400);
    addLog("thinking", "Analysing Aarhus, Odense, Aalborg demand signals…");
    await sleep(400);
    addLog("thinking", "Checking Remote EU & Global tiers…");
    await sleep(300);

    try {
      const res = await fetch("/api/agent/geo-audit", { method: "POST" });
      const data = (await res.json()) as GeoAuditResult;
      setGeoResult(data);
      const top = data.topRecommendation;
      addLog("success", `Geo audit done — Top market: ${top.flag} ${top.city} (${top.demandScore}/100)`);
      addLog("info", `~${top.estimatedRoles.toLocaleString()} matching roles · ${top.salaryBand}`);
    } catch {
      addLog("error", "Geo audit failed — check your setup");
    } finally {
      setIsRunning(false);
    }
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
    if (selectedMarkets.includes("remote")) {
      addLog("thinking", "Searching RemoteOK for remote roles…");
      await sleep(500);
    }
    if (selectedMarkets.includes("dk")) {
      addLog("thinking", "🇩🇰 Searching Jobnet.dk (Danish government job portal)…");
      await sleep(400);
      addLog("thinking", "🇩🇰 Searching Jobindex.dk (Denmark's largest job board)…");
      await sleep(400);
    }
    addLog("thinking", "Scoring each job against your CV…");

    try {
      const res = await fetch("/api/agent/job-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim() || undefined,
          location: searchLocation.trim() || undefined,
          markets: selectedMarkets,
        }),
      });
      const data = await res.json();
      setScoutResult(data);
      const dkMsg = data.dkCount > 0 ? ` · 🇩🇰 ${data.dkCount} from Denmark` : "";
      addLog("success", `Found ${data.totalFound} jobs${dkMsg}`);
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

  // ── Run All (3-step pipeline) ─────────────────────────────────────────────
  const runAll = async () => {
    setIsRunning(true);
    setPipelineStep(0);
    setLogs([]);
    addLog("info", "Starting full job search pipeline…");
    await sleep(300);

    // Step 1 – Geo Audit
    setActiveTab("geo");
    setPipelineStep(1);
    addLog("thinking", "Step 1/3: 🗺️ Geographic Market Audit…");
    await sleep(400);
    addLog("thinking", "Scoring Copenhagen, Aarhus, Odense, Aalborg, Remote…");
    await sleep(500);
    try {
      const geoRes = await fetch("/api/agent/geo-audit", { method: "POST" });
      const geoData = (await geoRes.json()) as GeoAuditResult;
      setGeoResult(geoData);
      const top = geoData.topRecommendation;
      addLog("success", `Geo audit done — best market: ${top.flag} ${top.city} (${top.demandScore}/100)`);
      // Auto-fill Scout location with the top geo market
      const scoutLoc = top.remoteEligible && top.id.startsWith("remote") ? "Remote" : top.city;
      setSearchLocation(scoutLoc);
      addLog("info", `Scout location pre-filled: ${scoutLoc}`);
    } catch {
      addLog("error", "Geo audit failed — continuing…");
    }

    await sleep(500);

    // Step 2 – CV Audit
    setActiveTab("audit");
    setPipelineStep(2);
    addLog("thinking", "Step 2/3: CV Audit…");
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

    // Step 3 – Job Scout
    setActiveTab("scout");
    setPipelineStep(3);
    addLog("thinking", "Step 3/3: Searching jobs (Remote + 🇩🇰 Danmark)…");
    await sleep(400);
    try {
      const scoutRes = await fetch("/api/agent/job-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markets: selectedMarkets }),
      });
      const scoutData = await scoutRes.json();
      setScoutResult(scoutData);
      const dkMsg = scoutData.dkCount > 0 ? ` (incl. 🇩🇰 ${scoutData.dkCount} from Denmark)` : "";
      addLog("success", `Found ${scoutData.totalFound} jobs${dkMsg}`);
    } catch {
      addLog("error", "Job search failed");
    }

    addLog("success", "Pipeline complete — review your results in each tab!");
    setActiveTab("geo");
    setPipelineStep(0);
    setIsRunning(false);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "geo", label: "Geo Audit", icon: "🗺️" },
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
          Your autonomous job search partner. Audits the job market + your CV,
          hunts live job listings ranked by your match score, and drafts
          personalised outreach — you review and approve everything before acting.
        </p>
      </header>

      {/* Run buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => void runAll()}
          disabled={isRunning}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isRunning ? "Agent running…" : "▶ Run Full Pipeline"}
        </button>
        <button
          onClick={() => { setActiveTab("geo"); void runGeoAudit(); }}
          disabled={isRunning}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          🗺️ Geo Audit only
        </button>
        <button
          onClick={() => { setActiveTab("audit"); void runCVAudit(); }}
          disabled={isRunning}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          🩺 Audit CV only
        </button>
        <button
          onClick={() => { setActiveTab("scout"); void runJobScout(); }}
          disabled={isRunning}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          🔍 Search jobs only
        </button>
      </div>

      {/* Pipeline progress bar */}
      {isRunning && pipelineStep > 0 && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Pipeline</p>
            <p className="text-xs text-brand-600">Step {pipelineStep} of 3</p>
          </div>
          <div className="flex gap-2">
            {[
              { n: 1, label: "🗺️ Geo Audit" },
              { n: 2, label: "🩺 CV Doctor" },
              { n: 3, label: "🔍 Job Scout" },
            ].map(({ n, label }) => (
              <div key={n} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                  pipelineStep > n ? "bg-emerald-500" :
                  pipelineStep === n ? "bg-brand-500 animate-pulse" :
                  "bg-brand-100"
                }`} />
                <p className={`mt-1 text-xs text-center ${
                  pipelineStep >= n ? "text-brand-700 font-medium" : "text-slate-400"
                }`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {tab.id === "geo" && geoResult && (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {geoResult.topRecommendation.demandScore}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Geo Audit tab */}
        {activeTab === "geo" && (
          <div>
            {!geoResult && !isRunning && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="text-slate-600 font-medium">Geo Audit ready</p>
                <p className="text-slate-400 text-sm mt-1 mb-4">
                  Scores your CV skills against job market demand in Copenhagen,
                  Aarhus, Odense, Aalborg, Remote EU &amp; Global
                </p>
                <button
                  onClick={() => void runGeoAudit()}
                  className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Run Geo Audit
                </button>
              </div>
            )}
            {geoResult && <GeoAuditReport result={geoResult} />}
          </div>
        )}

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
                  onClick={() => void runCVAudit()}
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
            {/* Markets toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Markets to search</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "remote" as Market, label: "🌍 Remote (global)", color: "purple" },
                  { id: "dk" as Market, label: "🇩🇰 Danmark", color: "red" },
                  { id: "global" as Market, label: "🌐 Global (Adzuna)", color: "blue" },
                ] as const).map(({ id, label, color }) => {
                  const active = selectedMarkets.includes(id);
                  const colorClass = active
                    ? color === "purple" ? "bg-purple-600 text-white border-purple-600"
                    : color === "red" ? "bg-red-600 text-white border-red-600"
                    : "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50";
                  return (
                    <button
                      key={id}
                      onClick={() => toggleMarket(id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${colorClass}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search fields */}
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
                  placeholder="e.g. København, Remote"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <button
                onClick={() => void runJobScout()}
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
                  Searches {selectedMarkets.includes("dk") ? "🇩🇰 Jobnet.dk + Jobindex.dk" : ""}
                  {selectedMarkets.includes("remote") ? (selectedMarkets.includes("dk") ? " + RemoteOK" : "RemoteOK") : ""}
                  {" "} and scores each job against your CV
                </p>
              </div>
            )}

            {scoutResult && (
              <JobScoutFeed
                jobs={scoutResult.jobs}
                query={scoutResult.query}
                totalFound={scoutResult.totalFound}
                hasAdzuna={scoutResult.hasAdzuna}
                dkCount={scoutResult.dkCount}
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
                  { day: "Mon", task: "Run Full Pipeline → Geo Audit shows best market, CV Doctor flags improvements", icon: "▶" },
                  { day: "Tue", task: "Run Job Scout in your top Geo market → pick 5 target roles", icon: "🔍" },
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

              <div className="mt-8 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Advanced Sync</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Sync your recent GitHub commits into the RAG Knowledge Base to dynamically inject live coding activity into your Cover Letters.
                </p>
                <button
                  onClick={runGithubSync}
                  disabled={isSyncingGithub}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSyncingGithub ? (
                    <>
                      <span className="animate-spin">⟳</span> Syncing...
                    </>
                  ) : (
                    "🐙 Sync GitHub Activity"
                  )}
                </button>
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
