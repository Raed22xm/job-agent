import type {
  Application,
  GeneratedCoverLetter,
  GeneratedCV,
  MatchResult,
  ParsedJob,
} from "@/types";
import { createApplicationId, getApplications } from "@/lib/storage";
import { findMatchingApplication, mergeApplicationWithSession } from "@/lib/jobnet/sessionApplication";
import { extractJobContact, formatRecruiterContact } from "@/lib/jobnet/extractJobContact";
import { extractJobDeadline } from "@/lib/jobnet/extractJobPostingMeta";
import { languageToPersonaId, type CvLanguage } from "@/lib/cvLanguage";

export async function buildApplicationToSave(
  parsedJob: ParsedJob,
  matchResult: MatchResult,
  generatedCV: GeneratedCV | null,
  generatedCoverLetter: GeneratedCoverLetter | null,
  cvLanguage: CvLanguage
): Promise<Application> {
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
  const deadline = existing?.deadline ?? extractJobDeadline(parsedJob.rawText);

  if (existing) {
    return {
      ...mergeApplicationWithSession(existing, parsedJob, matchResult, {
        generatedCV,
        generatedCoverLetter,
        cvOutputPath,
        coverLetterOutputPath,
      }),
      recruiterContact: existing.recruiterContact ?? recruiterContact,
      deadline: existing.deadline ?? deadline,
    };
  }

  return {
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
}
