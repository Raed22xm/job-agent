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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Cover Letter Preview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Draft generated from verified CV facts. Review and edit before sending.
        </p>
      </div>

      <article
        ref={exportRef}
        className="mx-auto max-w-2xl bg-white px-8 py-8 text-sm leading-relaxed text-slate-800"
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
