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
  detectCvLanguageFromJob,
  languageToPersonaId,
  type CvLanguage,
} from "@/lib/cvLanguage";
import {
  normalizeGeneratedCoverLetter,
  normalizeGeneratedCV,
  normalizeMatchResult,
  normalizeParsedJob,
} from "@/lib/normalizeStoredData";
import { isLikelyUrl, refreshParsedJob } from "@/lib/parseJob";
import {
  createApplicationId,
  getApplications,
  saveApplication,
} from "@/lib/storage";
import { findMatchingApplication, mergeApplicationWithSession } from "@/lib/jobnet/sessionApplication";
import {
  extractJobContact,
  formatRecruiterContact,
} from "@/lib/jobnet/extractJobContact";
import { extractJobDeadline } from "@/lib/jobnet/extractJobPostingMeta";
import {
  loadAnalysisSession,
  saveAnalysisSession,
  type ClientSessionSnapshot,
} from "@/lib/sessionClient";
import type {
  Application,
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
} from "@/types";

interface SessionSnapshot extends ClientSessionSnapshot {}

interface JobAgentContextValue {
  jobUrl: string;
  jobDescription: string;
  parsedJob: ParsedJob | null;
  matchResult: MatchResult | null;
  generatedCV: GeneratedCV | null;
  generatedCoverLetter: GeneratedCoverLetter | null;
  analysisMode: AnalysisMode | null;
  cvLanguage: CvLanguage;
  applications: Application[];
  setJobUrl: (value: string) => void;
  setJobDescription: (value: string) => void;
  setCvLanguage: (language: CvLanguage) => Promise<void>;
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
  refreshApplications: () => Promise<void>;
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
  const [cvLanguage, setCvLanguageState] = useState<CvLanguage>("danish");
  const [applications, setApplications] = useState<Application[]>([]);

  const refreshApplications = useCallback(async () => {
    try {
      setApplications(await getApplications());
    } catch {
      setApplications([]);
    }
  }, []);

  const persistSnapshot = useCallback(
    (overrides: Partial<SessionSnapshot> = {}) => {
      void saveAnalysisSession({
        jobUrl,
        jobDescription,
        parsedJob,
        matchResult,
        generatedCV,
        generatedCoverLetter,
        originalCV,
        originalCoverLetter,
        analysisMode,
        cvLanguage,
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
      cvLanguage,
    ]
  );

  useEffect(() => {
    void refreshApplications();

    void loadAnalysisSession().then((saved) => {
      if (!saved) return;

      setJobUrl(typeof saved.jobUrl === "string" ? saved.jobUrl : "");
      setJobDescription(
        typeof saved.jobDescription === "string" ? saved.jobDescription : ""
      );
      const normalizedJob = normalizeParsedJob(saved.parsedJob);
      setParsedJob(normalizedJob ? refreshParsedJob(normalizedJob) : null);
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
      if (saved.cvLanguage === "english" || saved.cvLanguage === "danish") {
        setCvLanguageState(saved.cvLanguage);
      }
    });
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

      const languageForAnalysis = detectCvLanguageFromJob(description);

      const response = await fetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: description,
          sourceUrl,
          enhanceWithAI,
          personaId: languageToPersonaId(languageForAnalysis),
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

      const detectedLanguage = detectCvLanguageFromJob(job.rawText);
      setCvLanguageState(detectedLanguage);
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

      void saveAnalysisSession({
        jobUrl: sourceUrl ?? jobUrl,
        jobDescription: description,
        parsedJob: job,
        matchResult: match,
        generatedCV: tailoredCV,
        generatedCoverLetter: coverLetter,
        originalCV: nextOriginalCV,
        originalCoverLetter: nextOriginalCoverLetter,
        analysisMode: mode,
        cvLanguage: languageForAnalysis,
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

  const regenerateForLanguage = useCallback(
    async (language: CvLanguage) => {
      if (!parsedJob) {
        setCvLanguageState(language);
        return;
      }

      const personaId = languageToPersonaId(language);
      const response = await fetch("/api/regenerate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedJob, personaId }),
      });

      const data = (await response.json()) as {
        error?: string;
        match?: unknown;
        generatedCV?: unknown;
        generatedCoverLetter?: unknown;
      };

      if (!response.ok) {
        throw new Error(data.error ?? `Language switch failed (${response.status})`);
      }

      const match = normalizeMatchResult(data.match);
      const tailoredCV = normalizeGeneratedCV(data.generatedCV);
      const coverLetter = normalizeGeneratedCoverLetter(data.generatedCoverLetter);

      if (!match || !tailoredCV || !coverLetter) {
        throw new Error("Language switch returned incomplete data.");
      }

      setCvLanguageState(language);
      setMatchResult(match);
      setGeneratedCV(tailoredCV);
      setGeneratedCoverLetter(coverLetter);
      setOriginalCV(tailoredCV);
      setOriginalCoverLetter(coverLetter);

      persistSnapshot({
        cvLanguage: language,
        matchResult: match,
        generatedCV: tailoredCV,
        generatedCoverLetter: coverLetter,
        originalCV: tailoredCV,
        originalCoverLetter: coverLetter,
      });
    },
    [parsedJob, persistSnapshot]
  );

  const setCvLanguage = useCallback(
    async (language: CvLanguage) => {
      if (language === cvLanguage) return;
      await regenerateForLanguage(language);
    },
    [cvLanguage, regenerateForLanguage]
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

    const existingApps = await getApplications();
    const existing = findMatchingApplication(existingApps, parsedJob);
    const extractedContact = extractJobContact(
      parsedJob.rawText,
      existing?.recruiterContact
    );
    const recruiterContact =
      existing?.recruiterContact ?? formatRecruiterContact(extractedContact);
    const deadline =
      existing?.deadline ?? extractJobDeadline(parsedJob.rawText);

    const application: Application = existing
      ? {
          ...mergeApplicationWithSession(existing, parsedJob, matchResult, {
            generatedCV,
            generatedCoverLetter,
            cvOutputPath,
            coverLetterOutputPath,
          }),
          recruiterContact: existing.recruiterContact ?? recruiterContact,
          deadline: existing.deadline ?? deadline,
        }
      : {
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
          recruiterContact,
          deadline,
          personaIdUsed: languageToPersonaId(cvLanguage),
        };

    await saveApplication(application);
    await refreshApplications();
    return application;
  }, [
    parsedJob,
    matchResult,
    generatedCV,
    generatedCoverLetter,
    refreshApplications,
    cvLanguage,
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
      cvLanguage,
      applications,
      setJobUrl,
      setJobDescription,
      setCvLanguage,
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
      cvLanguage,
      applications,
      updateGeneratedCV,
      updateGeneratedCoverLetter,
      resetGeneratedCV,
      resetGeneratedCoverLetter,
      setCvLanguage,
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
