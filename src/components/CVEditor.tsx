"use client";

import type { GeneratedCV } from "@/types";
import {
  linesToList,
  listToLines,
} from "@/lib/cv/editHelpers";

interface CVEditorProps {
  cv: GeneratedCV;
  onChange: (cv: GeneratedCV) => void;
  onReset?: () => void;
}

export default function CVEditor({ cv, onChange, onReset }: CVEditorProps) {
  const updateSummary = (summary: string) => {
    onChange({
      ...cv,
      sections: { ...cv.sections, summary },
    });
  };

  const updateSkills = (value: string) => {
    onChange({
      ...cv,
      sections: {
        ...cv.sections,
        skills: linesToList(value),
      },
    });
  };

  const updateBullets = (roleId: string, value: string) => {
    onChange({
      ...cv,
      sections: {
        ...cv.sections,
        experience: cv.sections.experience.map((role) =>
          role.id === roleId
            ? { ...role, bullets: linesToList(value) }
            : role
        ),
      },
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Edit CV</h2>
          <p className="mt-1 text-sm text-slate-500">
            Adjust wording and emphasis. Contact info and education stay from your
            verified master CV.
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

      <div className="space-y-6 px-6 py-5">
        <div>
          <label
            htmlFor="cv-summary"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Professional summary
          </label>
          <textarea
            id="cv-summary"
            value={cv.sections.summary}
            onChange={(e) => updateSummary(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label
            htmlFor="cv-skills"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            Skills
          </label>
          <textarea
            id="cv-skills"
            value={listToLines(cv.sections.skills)}
            onChange={(e) => updateSkills(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1.5 text-xs text-slate-500">One skill per line.</p>
        </div>

        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Experience bullets
          </p>
          {cv.sections.experience.map((role) => (
            <div key={role.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{role.title}</p>
              <p className="text-xs text-slate-600">
                {role.company} · {role.location}
              </p>
              <textarea
                aria-label={`Bullets for ${role.title}`}
                value={listToLines(role.bullets)}
                onChange={(e) => updateBullets(role.id, e.target.value)}
                rows={Math.max(4, role.bullets.length + 1)}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1.5 text-xs text-slate-500">One bullet per line.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
