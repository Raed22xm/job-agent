import type { Application } from "@/types";
import {
  extractJobContact,
  formatRecruiterContact,
} from "@/lib/jobnet/extractJobContact";
import { extractJobDeadline } from "@/lib/jobnet/extractJobPostingMeta";

/** Fill tracker fields from job posting text when not already set manually. */
export function enrichApplicationWithJobMeta(application: Application): Application {
  const rawText = application.job.rawText ?? "";
  const extractedContact = extractJobContact(
    rawText,
    application.recruiterContact
  );
  const recruiterContact =
    application.recruiterContact?.trim() ||
    formatRecruiterContact(extractedContact);
  const deadline =
    application.deadline?.trim() || extractJobDeadline(rawText);
  const link =
    application.link?.trim() || application.job.sourceUrl?.trim() || undefined;

  return {
    ...application,
    recruiterContact: recruiterContact || undefined,
    deadline: deadline || undefined,
    link,
  };
}
