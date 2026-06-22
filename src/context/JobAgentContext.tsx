"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateCoverLetter } from "@/lib/generateCoverLetter";
import { generateCV } from "@/lib/generateCV";
import { getMasterCV, matchCV } from "@/lib/matchCV";
import {
  normalizeMatchResult,
  normalizeParsedJob,
} from "@/lib/normalizeStoredData";
import { parseJob } from "@/lib/parseJob";
import {
  createApplicationId,
  getApplications,
  saveApplication,
} from "@/lib/storage";
import type {
  Application,
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
} from "@/types";

const SESSION_KEY = "job-agent-current-analysis";

interface JobAgentContextValue {
  jobUrl: string;
  jobDescription: string;
  parsedJob: ParsedJob | null;
  matchResult: MatchResult | null;
  generatedCV: GeneratedCV | null;
  generatedCoverLetter: GeneratedCoverLetter | null;
  applications: Application[];
  setJobUrl: (value: string) => void;
  setJobDescription: (value: string) => void;
  analyzeJob: () => void;
  saveToTracker: () => Application | null;
  refreshApplications: () => void;
}

const JobAgentContext = createContext<JobAgentContextValue | null>(null);

export function JobAgentProvider({ children }: { children: React.ReactNode }) {
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [parsedJob, setParsedJob] = useState<ParsedJob | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [generatedCV, setGeneratedCV] = useState<GeneratedCV | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] =
    useState<GeneratedCoverLetter | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  const refreshApplications = useCallback(() => {
    setApplications(getApplications());
  }, []);

  useEffect(() => {
    refreshApplications();

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw?.trim()) return;

      const saved = JSON.parse(raw) as {
        jobUrl?: string;
        jobDescription?: string;
        parsedJob?: unknown;
        matchResult?: unknown;
        generatedCV?: GeneratedCV | null;
        generatedCoverLetter?: GeneratedCoverLetter | null;
      };

      setJobUrl(typeof saved.jobUrl === "string" ? saved.jobUrl : "");
      setJobDescription(
        typeof saved.jobDescription === "string" ? saved.jobDescription : ""
      );
      setParsedJob(normalizeParsedJob(saved.parsedJob));
      setMatchResult(normalizeMatchResult(saved.matchResult));
      setGeneratedCV(
        saved.generatedCV && typeof saved.generatedCV === "object"
          ? (saved.generatedCV as GeneratedCV)
          : null
      );
      setGeneratedCoverLetter(
        saved.generatedCoverLetter && typeof saved.generatedCoverLetter === "object"
          ? saved.generatedCoverLetter
          : null
      );
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [refreshApplications]);

  const analyzeJob = useCallback(() => {
    const cv = getMasterCV();
    const job = parseJob(jobDescription);
    const match = matchCV(job, cv);
    const tailoredCV = generateCV(cv, job, match);
    const coverLetter = generateCoverLetter(cv, job);

    setParsedJob(job);
    setMatchResult(match);
    setGeneratedCV(tailoredCV);
    setGeneratedCoverLetter(coverLetter);

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        jobUrl,
        jobDescription,
        parsedJob: job,
        matchResult: match,
        generatedCV: tailoredCV,
        generatedCoverLetter: coverLetter,
      })
    );
  }, [jobDescription, jobUrl]);

  const saveToTracker = useCallback((): Application | null => {
    if (!parsedJob || !matchResult) return null;

    const now = new Date().toISOString();
    const application: Application = {
      id: createApplicationId(),
      createdAt: now,
      updatedAt: now,
      job: parsedJob,
      match: matchResult,
      status: "draft",
    };

    saveApplication(application);
    refreshApplications();
    return application;
  }, [parsedJob, matchResult, refreshApplications]);

  const value = useMemo(
    () => ({
      jobUrl,
      jobDescription,
      parsedJob,
      matchResult,
      generatedCV,
      generatedCoverLetter,
      applications,
      setJobUrl,
      setJobDescription,
      analyzeJob,
      saveToTracker,
      refreshApplications,
    }),
    [
      jobUrl,
      jobDescription,
      parsedJob,
      matchResult,
      generatedCV,
      generatedCoverLetter,
      applications,
      analyzeJob,
      saveToTracker,
      refreshApplications,
    ]
  );

  return (
    <JobAgentContext.Provider value={value}>{children}</JobAgentContext.Provider>
  );
}

export function useJobAgent(): JobAgentContextValue {
  const context = useContext(JobAgentContext);
  if (!context) {
    throw new Error("useJobAgent must be used within JobAgentProvider");
  }
  return context;
}
