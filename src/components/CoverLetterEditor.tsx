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
    <div className="glass-panel rounded-xl  ">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-4 ">
        <div>
          <h2 className="text-lg font-semibold text-foreground ">Edit Cover Letter</h2>
          <p className="mt-1 text-sm text-foreground-secondary dark:text-foreground-tertiary">
            Refine the draft before export. Use only verified facts from your CV.
          </p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-secondary transition hover:bg-background-secondary"
          >
            Reset to generated
          </button>
        )}
      </div>

      <div className="space-y-5 px-6 py-5">
        <div>
          <label
            htmlFor="letter-greeting"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
          >
            Greeting
          </label>
          <input
            id="letter-greeting"
            type="text"
            value={letter.greeting}
            onChange={(e) => updateField("greeting", e.target.value)}
            className="field-input"
          />
        </div>

        <div>
          <label
            htmlFor="letter-body"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
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
            className="field-textarea"
          />
          <p className="mt-1.5 text-xs text-foreground-secondary dark:text-foreground-tertiary">
            Separate paragraphs with a blank line.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="letter-closing"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
            >
              Closing
            </label>
            <input
              id="letter-closing"
              type="text"
              value={letter.closing}
              onChange={(e) => updateField("closing", e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label
              htmlFor="letter-signature"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-foreground-secondary dark:text-foreground-tertiary"
            >
              Signature
            </label>
            <input
              id="letter-signature"
              type="text"
              value={letter.signature}
              onChange={(e) => updateField("signature", e.target.value)}
              className="field-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
