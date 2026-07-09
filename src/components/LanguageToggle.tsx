"use client";

import {
  CV_LANGUAGE_OPTIONS,
  type CvLanguage,
} from "@/lib/cvLanguage";

interface LanguageToggleProps {
  value: CvLanguage;
  onChange: (language: CvLanguage) => void;
  disabled?: boolean;
}

export default function LanguageToggle({
  value,
  onChange,
  disabled = false,
}: LanguageToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg p-0.5"
      style={{
        background: "var(--background-secondary)",
        border: "1px solid var(--surface-border)",
      }}
      role="group"
      aria-label="CV language"
    >
      {CV_LANGUAGE_OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
            }`}
            aria-pressed={active}
          >
            <span aria-hidden="true">{option.flag}</span>{" "}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
