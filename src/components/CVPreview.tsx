import type { RefObject } from "react";
import { CV_SECTION_LABELS, type CvLanguage } from "@/lib/cvLanguage";
import type { GeneratedCV, Language } from "@/types";

interface CVPreviewProps {
  cv: GeneratedCV;
  exportRef?: RefObject<HTMLElement | null>;
  /** Full master CV languages (passed through from context) */
  languages?: Language[];
  /** Full master CV certifications */
  certifications?: string[];
  language?: CvLanguage;
}

/** Approximate A4 content height at preview scale (210mm width). */
const PAGE_BREAK_PX = 1050;

export default function CVPreview({
  cv,
  exportRef,
  languages,
  certifications,
  language = "english",
}: CVPreviewProps) {
  const { header, summary, skills, experience, education, projects } = cv.sections;
  const labels = CV_SECTION_LABELS[language];

  return (
    <div className="glass-panel rounded-xl">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">ATS CV Preview</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Hybrid one-column layout inspired by the supplied examples, using verified data only.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[210mm] bg-white">
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
          className="cv-document overflow-visible bg-white px-[12mm] py-[10mm] font-sans text-[#111111]"
          style={{ width: "210mm", maxWidth: "100%" }}
        >
          <header className="border-b-2 border-[#52705A] pb-2 text-left">
            <h1 className="text-[20pt] font-bold leading-tight text-[#111111]">
              {header.fullName}
            </h1>
            <p className="mt-1 text-[9pt] text-[#4B5563]">
              {[header.location, header.email, header.phone]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {(header.linkedin || header.portfolio) && (
              <p className="mt-0.5 text-[8.5pt] text-[#5F6B63]">
                {[header.linkedin, header.portfolio].filter(Boolean).join(" · ")}
              </p>
            )}
          </header>

          <section className="mt-3 border-l-[3px] border-[#52705A] bg-[#E7F1E8] px-3 py-2.5">
            <h2 className="text-[8.5pt] font-bold uppercase tracking-[0.08em] text-[#33473A]">
              {labels.summary}
            </h2>
            <p className="mt-1 text-[10pt] leading-snug text-[#111111]">{summary}</p>
          </section>

          <Section title={labels.skills}>
            <p className="text-[10pt] leading-snug text-[#111111]">
              {skills.join(" · ")}
            </p>
          </Section>

          <Section title={labels.experience}>
            <div className="mt-1.5 space-y-2.5">
              {experience.map((role, roleIndex) => (
                <div key={`${role.id}-${roleIndex}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0">
                    <h3 className="text-[10pt] font-bold text-[#111111]">
                      {role.title}
                    </h3>
                    <span className="shrink-0 text-[8.5pt] font-medium text-[#5F6B63]">
                      {role.startDate} – {role.endDate}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[8.5pt] font-medium text-[#4B5563]">
                    {role.company} · {role.location}
                  </p>
                  <ul className="list-disc space-y-0.5 pl-[1.1em] text-[10pt] leading-snug text-[#111111]">
                    {role.bullets.map((bullet, bulletIndex) => (
                      <li key={`${role.id}-${roleIndex}-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {projects && projects.length > 0 && (
            <Section title={labels.projects}>
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

          <Section title={labels.education}>
            <div className="mt-1 space-y-1">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-[10pt] font-bold text-[#111111]">
                    {edu.degree} in {edu.field}
                  </p>
                  <p className="text-[8.5pt] text-[#4B5563]">
                    {edu.institution} · {edu.startDate} – {edu.endDate}
                  </p>
                  {edu.details && edu.details.length > 0 && (
                    <ul className="mt-0.5 list-disc pl-[1.1em] text-[8.5pt] leading-snug text-[#5F6B63]">
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
            <Section title={labels.certifications}>
              <ul className="mt-1 list-disc space-y-0 pl-[1.1em] text-[10pt] leading-snug text-[#111111]">
                {certifications.map((cert, index) => (
                  <li key={`${cert}-${index}`}>{cert}</li>
                ))}
              </ul>
            </Section>
          )}

          {languages && languages.length > 0 && (
            <Section title={labels.languages}>
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
            {cv.atsNotes.map((note, index) => (
              <li key={`${note}-${index}`}>{note}</li>
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
    <section className="mt-3">
      <h2 className="border-b border-[#52705A] pb-0.5 text-[8.5pt] font-bold uppercase tracking-[0.08em] text-[#33473A]">
        {title}
      </h2>
      {children}
    </section>
  );
}
