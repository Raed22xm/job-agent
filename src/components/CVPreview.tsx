import type { RefObject } from "react";
import type { GeneratedCV, Language } from "@/types";

interface CVPreviewProps {
  cv: GeneratedCV;
  exportRef?: RefObject<HTMLElement | null>;
  /** Full master CV languages (passed through from context) */
  languages?: Language[];
  /** Full master CV certifications */
  certifications?: string[];
}

/** Approximate A4 content height at preview scale (210mm width). */
const PAGE_BREAK_PX = 1050;

export default function CVPreview({
  cv,
  exportRef,
  languages,
  certifications,
}: CVPreviewProps) {
  const { header, summary, skills, experience, education, projects } = cv.sections;

  return (
    <div className="glass-panel rounded-xl">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">ATS CV Preview</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          One-column layout using verified master CV data only.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[210mm] bg-surface">
        <div
          className="cv-export-hide pointer-events-none absolute left-0 right-0 border-t border-dashed border-border"
          style={{ top: `${PAGE_BREAK_PX}px` }}
          title="Approximate A4 page break"
        >
          <span className="absolute right-2 -top-5 rounded bg-background-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground-tertiary">
            ≈ page break
          </span>
        </div>

        <article
          ref={exportRef}
          className="cv-document bg-surface px-[10mm] py-[8mm]"
          style={{ width: "210mm", maxWidth: "100%" }}
        >
          <header className="border-b border-slate-400 pb-1.5 text-center">
            <h1 className="text-[15pt] font-bold leading-tight text-[#111111]">
              {header.fullName}
            </h1>
            <p className="cv-text-muted mt-0.5 text-[8.5pt]">
              {[header.location, header.email, header.phone]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {(header.linkedin || header.portfolio) && (
              <p className="cv-text-subtle text-[8pt]">
                {[header.linkedin, header.portfolio].filter(Boolean).join(" · ")}
              </p>
            )}
          </header>

          <Section title="Professional Summary">
            <p className="text-[10pt] leading-snug text-[#111111]">{summary}</p>
          </Section>

          <Section title="Skills">
            <p className="text-[10pt] leading-snug text-[#111111]">
              {skills.join(" · ")}
            </p>
          </Section>

          <Section title="Experience">
            <div className="mt-1 space-y-1.5">
              {experience.map((role) => (
                <div key={role.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0">
                    <h3 className="text-[10pt] font-bold text-[#111111]">
                      {role.title}
                    </h3>
                    <span className="cv-text-subtle shrink-0 text-[8pt]">
                      {role.startDate} – {role.endDate}
                    </span>
                  </div>
                  <p className="cv-text-muted text-[8.5pt] font-medium">
                    {role.company} · {role.location}
                  </p>
                  <ul className="list-disc space-y-0.5 pl-[1.1em] text-[10pt] leading-snug text-[#111111]">
                    {role.bullets.map((bullet, index) => (
                      <li key={`${role.id}-${index}`}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {projects && projects.length > 0 && (
            <Section title="Projects">
              <div className="mt-1 space-y-1">
                {projects.map((project) => (
                  <div key={project.id}>
                    <p className="text-[10pt] font-bold text-[#111111]">
                      {project.name}
                    </p>
                    <p className="text-[10pt] leading-snug text-[#111111]">
                      {project.description}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Education">
            <div className="mt-1 space-y-1">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-[10pt] font-bold text-[#111111]">
                    {edu.degree} in {edu.field}
                  </p>
                  <p className="cv-text-muted text-[8.5pt]">
                    {edu.institution} · {edu.startDate} – {edu.endDate}
                  </p>
                  {edu.details && edu.details.length > 0 && (
                    <ul className="cv-text-subtle mt-0.5 list-disc pl-[1.1em] text-[8.5pt] leading-snug">
                      {edu.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {certifications && certifications.length > 0 && (
            <Section title="Certifications">
              <ul className="mt-1 list-disc space-y-0 pl-[1.1em] text-[10pt] leading-snug text-[#111111]">
                {certifications.map((cert) => (
                  <li key={cert}>{cert}</li>
                ))}
              </ul>
            </Section>
          )}

          {languages && languages.length > 0 && (
            <Section title="Languages">
              <p className="text-[10pt] leading-snug text-[#111111]">
                {languages.map(({ language, level }) => `${language} (${level})`).join(" · ")}
              </p>
            </Section>
          )}
        </article>
      </div>

      {cv.atsNotes.length > 0 && (
        <div className="border-t border-border bg-background-secondary px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            ATS Notes
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground-secondary">
            {cv.atsNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-2">
      <h2 className="border-b border-slate-400 pb-0.5 text-[8pt] font-bold uppercase tracking-wide text-[#111111]">
        {title}
      </h2>
      {children}
    </section>
  );
}
