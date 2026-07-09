import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { AnalysisMode } from "@/lib/analyzeJobLocal";
import type { CvLanguage } from "@/lib/cvLanguage";
import type {
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
} from "@/types";

const RELATIVE_PATH = path.join("data", "session", "current-analysis.json");

export interface AnalysisSessionSnapshot {
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
  updatedAt: string;
}

export function sessionFilePath(workspaceRoot = process.cwd()): string {
  return path.join(workspaceRoot, RELATIVE_PATH);
}

export async function readSessionFromDisk(
  workspaceRoot = process.cwd()
): Promise<AnalysisSessionSnapshot | null> {
  const filePath = sessionFilePath(workspaceRoot);

  try {
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw) as AnalysisSessionSnapshot;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

export async function writeSessionToDisk(
  snapshot: Omit<AnalysisSessionSnapshot, "updatedAt">,
  workspaceRoot = process.cwd()
): Promise<AnalysisSessionSnapshot> {
  const filePath = sessionFilePath(workspaceRoot);
  await mkdir(path.dirname(filePath), { recursive: true });

  const payload: AnalysisSessionSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export async function clearSessionOnDisk(workspaceRoot = process.cwd()): Promise<void> {
  const filePath = sessionFilePath(workspaceRoot);
  try {
    await writeFile(
      filePath,
      JSON.stringify(
        {
          jobUrl: "",
          jobDescription: "",
          parsedJob: null,
          matchResult: null,
          generatedCV: null,
          generatedCoverLetter: null,
          originalCV: null,
          originalCoverLetter: null,
          analysisMode: null,
          cvLanguage: null,
          updatedAt: new Date().toISOString(),
        } satisfies AnalysisSessionSnapshot,
        null,
        2
      ),
      "utf8"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
}
