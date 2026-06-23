"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AnalysisMode } from "@/lib/analyzeJobLocal";
import {
  normalizeGeneratedCoverLetter,
  normalizeGeneratedCV,
  normalizeMatchResult,
  normalizeParsedJob,
} from "@/lib/normalizeStoredData";
import { isLikelyUrl } from "@/lib/parseJob";
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

interface SessionSnapshot {
  jobUrl: string;
  jobDescription: string;
  parsedJob: ParsedJob | null;
  matchResult: MatchResult | null;
  generatedCV: GeneratedCV | null;
  generatedCoverLetter: GeneratedCoverLetter | null;
  originalCV: GeneratedCV | null;
  originalCoverLetter: GeneratedCoverLetter | null;
  analysisMode: AnalysisMode | null;
}

function readSessionSnapshot(): Partial<SessionSnapshot> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw?.trim()) return null;
    return JSON.parse(raw) as Partial<SessionSnapshot>;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSessionSnapshot(snapshot: SessionSnapshot): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
}

interface JobAgentContextValue {
  jobUrl: string;
  jobDescription: string;
  parsedJob: ParsedJob | null;
  matchResult: MatchResult | null;
  generatedCV: GeneratedCV | null;
  generatedCoverLetter: GeneratedCoverLetter | null;
  analysisMode: AnalysisMode | null;
  applications: Application[];
  setJobUrl: (value: string) => void;
  setJobDescription: (value: string) => void;
  updateGeneratedCV: (cv: GeneratedCV) => void;
  updateGeneratedCoverLetter: (letter: GeneratedCoverLetter) => void;
  resetGeneratedCV: () => void;
  resetGeneratedCoverLetter: () => void;
  importJobFromUrl: () => Promise<{
    description: string;
    sourceUrl: string;
    message: string;
  }>;
  analyzeJob: (options?: { enhanceWithAI?: boolean }) => Promise<void>;
  enhanceWithAI: () => Promise<void>;
  saveToTracker: () => Promise<Application | null>;
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
  const [originalCV, setOriginalCV] = useState<GeneratedCV | null>(null);
  const [originalCoverLetter, setOriginalCoverLetter] =
    useState<GeneratedCoverLetter | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  const refreshApplications = useCallback(() => {
    setApplications(getApplications());
  }, []);

  const persistSnapshot = useCallback(
    (overrides: Partial<SessionSnapshot> = {}) => {
      writeSessionSnapshot({
        jobUrl,
        jobDescription,
        parsedJob,
        matchResult,
        generatedCV,
        generatedCoverLetter,
        originalCV,
        originalCoverLetter,
        analysisMode,
        ...overrides,
      });
    },
    [
      jobUrl,
      jobDescription,
      parsedJob,
      matchResult,
      generatedCV,
      generatedCoverLetter,
      originalCV,
      originalCoverLetter,
      analysisMode,
    ]
  );

  useEffect(() => {
    refreshApplications();

    const saved = readSessionSnapshot();
    if (!saved) return;

    setJobUrl(typeof saved.jobUrl === "string" ? saved.jobUrl : "");
    setJobDescription(
      typeof saved.jobDescription === "string" ? saved.jobDescription : ""
    );
    setParsedJob(normalizeParsedJob(saved.parsedJob));
    setMatchResult(normalizeMatchResult(saved.matchResult));
    setGeneratedCV(normalizeGeneratedCV(saved.generatedCV));
    setGeneratedCoverLetter(
      normalizeGeneratedCoverLetter(saved.generatedCoverLetter)
    );
    setOriginalCV(normalizeGeneratedCV(saved.originalCV ?? saved.generatedCV));
    setOriginalCoverLetter(
      normalizeGeneratedCoverLetter(
        saved.originalCoverLetter ?? saved.generatedCoverLetter
      )
    );
    setAnalysisMode(saved.analysisMode ?? null);
  }, [refreshApplications]);

  const importJobFromUrl = useCallback(async () => {
    const url = jobUrl.trim();
    if (!isLikelyUrl(url)) {
      throw new Error("Enter a valid job URL before importing.");
    }

    const response = await fetch("/api/fetch-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = (await response.json()) as {
      error?: string;
      sourceUrl?: string;
      jobDescription?: string;
      savedPath?: string;
      warning?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? `Import failed (${response.status})`);
    }

    if (!data.jobDescription?.trim()) {
      throw new Error("Import returned empty job description.");
    }

    const sourceUrl = data.sourceUrl ?? url;
    const description = data.jobDescription;

    setJobUrl(sourceUrl);
    setJobDescription(description);

    const parts = [
      data.warning,
      data.savedPath ? `Saved to ${data.savedPath}.` : undefined,
    ].filter(Boolean);

    return {
      description,
      sourceUrl,
      message: parts.join(" ") || "Job imported.",
    };
  }, [jobUrl]);

  const runAnalysisRequest = useCallback(
    async (enhanceWithAI: boolean) => {
      let description = jobDescription;
      let sourceUrl = isLikelyUrl(jobUrl) ? jobUrl.trim() : undefined;

      if (description.trim().length < 40 && sourceUrl) {
        const imported = await importJobFromUrl();
        description = imported.description;
        sourceUrl = imported.sourceUrl;
      }

      if (description.trim().length < 40) {
        throw new Error(
          "Paste or import a full job description before analyzing."
        );
      }

      const response = await fetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: description,
          sourceUrl,
          enhanceWithAI,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        mode?: AnalysisMode;
        job?: unknown;
        match?: unknown;
        generatedCV?: unknown;
        generatedCoverLetter?: unknown;
      };

      if (!response.ok) {
        throw new Error(data.error ?? `Analysis failed (${response.status})`);
      }

      const job = normalizeParsedJob(data.job);
      const match = normalizeMatchResult(data.match);
      const tailoredCV = normalizeGeneratedCV(data.generatedCV);
      const coverLetter = normalizeGeneratedCoverLetter(data.generatedCoverLetter);

      if (!job || !match || !tailoredCV || !coverLetter) {
        throw new Error("Analysis returned incomplete data.");
      }

      setParsedJob(job);
      setMatchResult(match);
      setGeneratedCV(tailoredCV);
      setGeneratedCoverLetter(coverLetter);

      const nextOriginalCV = enhanceWithAI ? originalCV ?? tailoredCV : tailoredCV;
      const nextOriginalCoverLetter = enhanceWithAI
        ? originalCoverLetter ?? coverLetter
        : coverLetter;

      if (!enhanceWithAI) {
        setOriginalCV(tailoredCV);
        setOriginalCoverLetter(coverLetter);
      }

      const mode = data.mode ?? (enhanceWithAI ? "ai-fallback" : "local");
      setAnalysisMode(mode);

      writeSessionSnapshot({
        jobUrl: sourceUrl ?? jobUrl,
        jobDescription: description,
        parsedJob: job,
        matchResult: match,
        generatedCV: tailoredCV,
        generatedCoverLetter: coverLetter,
        originalCV: nextOriginalCV,
        originalCoverLetter: nextOriginalCoverLetter,
        analysisMode: mode,
      });
    },
    [
      jobDescription,
      jobUrl,
      importJobFromUrl,
      originalCV,
      originalCoverLetter,
    ]
  );

  const analyzeJob = useCallback(
    async (options?: { enhanceWithAI?: boolean }) => {
      await runAnalysisRequest(options?.enhanceWithAI === true);
    },
    [runAnalysisRequest]
  );

  const enhanceWithAI = useCallback(async () => {
    await runAnalysisRequest(true);
  }, [runAnalysisRequest]);

  const updateGeneratedCV = useCallback(
    (cv: GeneratedCV) => {
      setGeneratedCV(cv);
      persistSnapshot({ generatedCV: cv });
    },
    [persistSnapshot]
  );

  const updateGeneratedCoverLetter = useCallback(
    (letter: GeneratedCoverLetter) => {
      setGeneratedCoverLetter(letter);
      persistSnapshot({ generatedCoverLetter: letter });
    },
    [persistSnapshot]
  );

  const resetGeneratedCV = useCallback(() => {
    if (!originalCV) return;
    updateGeneratedCV(originalCV);
  }, [originalCV, updateGeneratedCV]);

  const resetGeneratedCoverLetter = useCallback(() => {
    if (!originalCoverLetter) return;
    updateGeneratedCoverLetter(originalCoverLetter);
  }, [originalCoverLetter, updateGeneratedCoverLetter]);

  const saveToTracker = useCallback(async (): Promise<Application | null> => {
    if (!parsedJob || !matchResult) return null;

    const now = new Date().toISOString();
    let cvOutputPath: string | undefined;
    let coverLetterOutputPath: string | undefined;

    if (generatedCV || generatedCoverLetter) {
      try {
        const response = await fetch("/api/save-application-outputs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: parsedJob.company,
            title: parsedJob.title,
            generatedCV,
            generatedCoverLetter,
          }),
        });

        const data = (await response.json()) as {
          error?: string;
          cvPath?: string;
          coverLetterPath?: string;
        };

        if (response.ok) {
          cvOutputPath = data.cvPath;
          coverLetterOutputPath = data.coverLetterPath;
        }
      } catch {
        // Tracker save continues even if file write fails (e.g. read-only deploy)
      }
    }

    const application: Application = {
      id: createApplicationId(),
      createdAt: now,
      updatedAt: now,
      job: parsedJob,
      match: matchResult,
      status: "draft",
      company: parsedJob.company,
      jobTitle: parsedJob.title,
      link: parsedJob.sourceUrl,
      location: parsedJob.location,
      matchScore: matchResult.score,
      cvVersion: cvOutputPath ?? `generated-${now.slice(0, 10)}`,
      coverLetterStatus: generatedCoverLetter ? "draft" : "none",
      coverLetterOutputPath,
    };

    saveApplication(application);
    refreshApplications();
    return application;
  }, [
    parsedJob,
    matchResult,
    generatedCV,
    generatedCoverLetter,
    refreshApplications,
  ]);

  const value = useMemo(
    () => ({
      jobUrl,
      jobDescription,
      parsedJob,
      matchResult,
      generatedCV,
      generatedCoverLetter,
      analysisMode,
      applications,
      setJobUrl,
      setJobDescription,
      updateGeneratedCV,
      updateGeneratedCoverLetter,
      resetGeneratedCV,
      resetGeneratedCoverLetter,
      importJobFromUrl,
      analyzeJob,
      enhanceWithAI,
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
      analysisMode,
      applications,
      updateGeneratedCV,
      updateGeneratedCoverLetter,
      resetGeneratedCV,
      resetGeneratedCoverLetter,
      importJobFromUrl,
      analyzeJob,
      enhanceWithAI,
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
