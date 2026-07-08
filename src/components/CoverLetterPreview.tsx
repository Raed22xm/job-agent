import type { RefObject } from "react";
import type { GeneratedCoverLetter } from "@/types";

interface CoverLetterPreviewProps {
  letter: GeneratedCoverLetter;
  exportRef?: RefObject<HTMLElement | null>;
}

export default function CoverLetterPreview({
  letter,
  exportRef,
}: CoverLetterPreviewProps) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">Cover Letter Preview</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Draft generated from verified CV facts. Review and edit before sending.
        </p>
      </div>

      <article
        ref={exportRef}
        className="export-document mx-auto max-w-2xl bg-surface px-8 py-8 text-[11pt] leading-relaxed text-[#111111]"
      >
        <p>{letter.greeting}</p>
        {letter.paragraphs.map((paragraph, index) => (
          <p key={index} className="mt-4">
            {paragraph}
          </p>
        ))}
        <p className="mt-6">{letter.closing}</p>
        <p className="mt-8 font-medium">{letter.signature}</p>
      </article>
    </div>
  );
}
