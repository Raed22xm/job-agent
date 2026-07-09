import type { AnalysisMode } from "@/lib/analyzeJobLocal";
import type { CvLanguage } from "@/lib/cvLanguage";
import type {
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
} from "@/types";

const LEGACY_SESSION_KEY = "job-agent-current-analysis";

export interface ClientSessionSnapshot {
  jobUrl: string;
  jobDescription: string;
  parsedJob: ParsedJob | null;
  matchResult: MatchResult | null;
  generatedCV: GeneratedCV | null;
  generatedCoverLetter: GeneratedCoverLetter | null;
  originalCV: GeneratedCV | null;
  originalCoverLetter: GeneratedCoverLetter | null;
  analysisMode: AnalysisMode | null;
  cvLanguage?: CvLanguage | null;
}

function readLegacySession(): Partial<ClientSessionSnapshot> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw?.trim()) return null;
    return JSON.parse(raw) as Partial<ClientSessionSnapshot>;
  } catch {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return null;
  }
}

export async function loadAnalysisSession(): Promise<Partial<ClientSessionSnapshot> | null> {
  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    const data = (await response.json()) as {
      session?: ClientSessionSnapshot | null;
    };

    if (response.ok && data.session?.jobDescription) {
      return data.session;
    }
  } catch {
    // fall through to legacy migration
  }

  const legacy = readLegacySession();
  if (legacy?.jobDescription) {
    await saveAnalysisSession({
      jobUrl: typeof legacy.jobUrl === "string" ? legacy.jobUrl : "",
      jobDescription:
        typeof legacy.jobDescription === "string" ? legacy.jobDescription : "",
      parsedJob: legacy.parsedJob ?? null,
      matchResult: legacy.matchResult ?? null,
      generatedCV: legacy.generatedCV ?? null,
      generatedCoverLetter: legacy.generatedCoverLetter ?? null,
      originalCV: legacy.originalCV ?? legacy.generatedCV ?? null,
      originalCoverLetter:
        legacy.originalCoverLetter ?? legacy.generatedCoverLetter ?? null,
      analysisMode: legacy.analysisMode ?? null,
    });

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(LEGACY_SESSION_KEY);
    }
  }

  return legacy;
}

export async function saveAnalysisSession(
  snapshot: ClientSessionSnapshot
): Promise<void> {
  try {
    await fetch("/api/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
  } catch {
    // Non-blocking — analysis still works in memory for this tab
  }
}
