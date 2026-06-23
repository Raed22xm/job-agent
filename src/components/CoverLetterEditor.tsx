"use client";

import type { GeneratedCoverLetter } from "@/types";
import {
  paragraphsToText,
  textToParagraphs,
} from "@/lib/cv/editHelpers";

interface CoverLetterEditorProps {
  letter: GeneratedCoverLetter;
  onChange: (letter: GeneratedCoverLetter) => void;
  onReset?: () => void;
}

export default function CoverLetterEditor({
  letter,
  onChange,
  onReset,
}: CoverLetterEditorProps) {
  const updateField = <K extends keyof GeneratedCoverLetter>(
    field: K,
    value: GeneratedCoverLetter[K]
  ) => {
    onChange({ ...letter, [field]: value });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Edit Cover Letter</h2>
          <p className="mt-1 text-sm text-slate-500">
            Refine the draft before export. Use only verified facts from your CV.
          </p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Reset to generated
          </button>
        )}
      </div>

      <div className="space-y-5 px-6 py-5">
        <div>
          <label
            htmlFor="letter-greeting"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Greeting
          </label>
          <input
            id="letter-greeting"
            type="text"
            value={letter.greeting}
            onChange={(e) => updateField("greeting", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label
            htmlFor="letter-body"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Body
          </label>
          <textarea
            id="letter-body"
            value={paragraphsToText(letter.paragraphs)}
            onChange={(e) =>
              updateField("paragraphs", textToParagraphs(e.target.value))
            }
            rows={12}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Separate paragraphs with a blank line.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="letter-closing"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Closing
            </label>
            <input
              id="letter-closing"
              type="text"
              value={letter.closing}
              onChange={(e) => updateField("closing", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label
              htmlFor="letter-signature"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Signature
            </label>
            <input
              id="letter-signature"
              type="text"
              value={letter.signature}
              onChange={(e) => updateField("signature", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
