import type { RefObject } from "react";
import {
  COVER_LETTER_LABELS,
  coverLetterHeadline,
  type CvLanguage,
} from "@/lib/cvLanguage";
import type { GeneratedCoverLetter, PersonalInfo } from "@/types";

interface CoverLetterPreviewProps {
  letter: GeneratedCoverLetter;
  exportRef?: RefObject<HTMLElement | null>;
  language?: CvLanguage;
  applicant?: PersonalInfo;
  company: string;
  title: string;
}

export default function CoverLetterPreview({
  letter,
  exportRef,
  language = "english",
  applicant,
  company,
  title,
}: CoverLetterPreviewProps) {
  const languageLabel = language === "danish" ? "Dansk" : "English";
  const labels = COVER_LETTER_LABELS[language];
  const contact = applicant
    ? [applicant.location, applicant.email, applicant.phone].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="rounded-xl border border-border bg-background shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">Cover Letter Preview</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          {languageLabel} draft from verified CV facts. Review and edit before sending.
        </p>
      </div>

      <article
        ref={exportRef}
        className="export-document mx-auto min-h-[297mm] max-w-[210mm] bg-white px-[18mm] py-[16mm] font-sans text-[10.5pt] leading-[1.5] text-[#111111]"
      >
        <header className="border-b-2 border-[#52705A] pb-3">
          {applicant?.fullName && (
            <p className="text-[13pt] font-bold text-[#111111]">{applicant.fullName}</p>
          )}
          {contact && <p className="mt-0.5 text-[8.5pt] text-[#4B5563]">{contact}</p>}
          {applicant && (applicant.linkedin || applicant.portfolio) && (
            <p className="text-[8.5pt] text-[#4B5563]">
              {[applicant.linkedin, applicant.portfolio].filter(Boolean).join(" · ")}
            </p>
          )}
        </header>
        <h1 className="mt-5 text-[15pt] font-bold leading-tight text-[#33473A]">
          {coverLetterHeadline(company, title, language)}
        </h1>
        <p className="mt-5">{letter.greeting}</p>
        {letter.paragraphs.map((paragraph, index) => (
          <section key={index} className="mt-4">
            {index < 2 && (
              <h2 className="mb-1 text-[9pt] font-bold uppercase tracking-[0.06em] text-[#52705A]">
                {index === 0 ? labels.motivation : labels.evidence}
              </h2>
            )}
            <p>{paragraph}</p>
          </section>
        ))}
        <p className="mt-5">{letter.closing}</p>
        <p className="mt-6 font-medium">{letter.signature}</p>
      </article>
    </div>
  );
}
