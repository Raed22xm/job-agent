import type { RefObject } from "react";
import type { GeneratedCV } from "@/types";

interface CVPreviewProps {
  cv: GeneratedCV;
  exportRef?: RefObject<HTMLElement | null>;
}

export default function CVPreview({ cv, exportRef }: CVPreviewProps) {
  const { header, summary, skills, experience, education, projects } = cv.sections;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">ATS CV Preview</h2>
        <p className="mt-1 text-sm text-slate-500">
          One-column layout using verified master CV data only.
        </p>
      </div>

      <article
        ref={exportRef}
        className="mx-auto max-w-2xl bg-white px-8 py-8 font-serif text-slate-900"
      >
        <header className="border-b border-slate-300 pb-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{header.fullName}</h1>
          <p className="mt-2 text-sm text-slate-700">
            {header.location} · {header.email} · {header.phone}
          </p>
          {(header.linkedin || header.portfolio) && (
            <p className="mt-1 text-sm text-slate-600">
              {[header.linkedin, header.portfolio].filter(Boolean).join(" · ")}
            </p>
          )}
        </header>

        <section className="mt-6">
          <h2 className="border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wider">
            Professional Summary
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{summary}</p>
        </section>

        <section className="mt-6">
          <h2 className="border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wider">
            Skills
          </h2>
          <p className="mt-2 text-sm leading-relaxed">{skills.join(" · ")}</p>
        </section>

        <section className="mt-6">
          <h2 className="border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wider">
            Experience
          </h2>
          <div className="mt-3 space-y-5">
            {experience.map((role) => (
              <div key={role.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold">{role.title}</h3>
                  <span className="text-xs text-slate-600">
                    {role.startDate} – {role.endDate}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {role.company} · {role.location}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {role.bullets.map((bullet, index) => (
                    <li key={`${role.id}-${index}`}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {projects && projects.length > 0 && (
          <section className="mt-6">
            <h2 className="border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wider">
              Projects
            </h2>
            <div className="mt-3 space-y-3">
              {projects.map((project) => (
                <div key={project.id}>
                  <p className="text-sm font-bold">{project.name}</p>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wider">
            Education
          </h2>
          <div className="mt-3 space-y-3">
            {education.map((edu) => (
              <div key={edu.id}>
                <p className="text-sm font-bold">
                  {edu.degree} in {edu.field}
                </p>
                <p className="text-sm text-slate-700">
                  {edu.institution} · {edu.startDate} – {edu.endDate}
                </p>
              </div>
            ))}
          </div>
        </section>
      </article>

      {cv.atsNotes.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            ATS Notes
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
            {cv.atsNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
