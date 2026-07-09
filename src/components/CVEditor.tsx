"use client";

import type { GeneratedCV } from "@/types";
import { linesToList, listToLines } from "@/lib/cv/editHelpers";
import { bulletQuality, summaryQualityScore, type BulletQuality } from "@/lib/cv/cvFeedback";

interface CVEditorProps {
  cv: GeneratedCV;
  onChange: (cv: GeneratedCV) => void;
  onReset?: () => void;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function summaryCountLabel(text: string): { label: string; color: string } {
  const wc = wordCount(text);
  if (wc === 0) return { label: "0 words", color: "text-foreground-tertiary" };
  if (wc < 40) return { label: `${wc} words — too short`, color: "text-danger" };
  if (wc <= 120) return { label: `${wc} words — good`, color: "text-success" };
  return { label: `${wc} words — trim it`, color: "text-warning" };
}

const QUALITY_DOT: Record<BulletQuality, { color: string; title: string }> = {
  strong: { color: "bg-success", title: "Strong — action verb + metric" },
  moderate: { color: "bg-warning", title: "Moderate — could add a metric or stronger verb" },
  weak: { color: "bg-danger", title: "Weak — consider adding a strong action verb and a number" },
};

function BulletQualityDots({ bullets }: { bullets: string[] }) {
  const active = bullets.filter((b) => b.trim());
  if (active.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {active.map((bullet, i) => {
        const q = bulletQuality(bullet);
        const cfg = QUALITY_DOT[q];
        return (
          <span
            key={i}
            title={cfg.title}
            className={`h-2.5 w-2.5 rounded-full ${cfg.color}`}
          />
        );
      })}
      <span className="text-[11px] text-foreground-tertiary ml-1">
        {active.filter((b) => bulletQuality(b) === "strong").length}/{active.length} strong
      </span>
    </div>
  );
}

function SummaryTip({ text }: { text: string }) {
  const wc = wordCount(text);
  const hasNumber = /\d/.test(text);
  const weakStart = /^(i am|i have|responsible for|duties|helped|assisted|worked on)/i.test(text.trim());

  const tips: string[] = [];
  if (weakStart) tips.push('Lead with your job title instead of "I am…" or "Responsible for…"');
  if (!hasNumber && wc > 10) tips.push("Add one metric (team size, % improvement, revenue) for instant impact.");
  if (wc < 40 && wc > 0) tips.push("Expand to 60–120 words to give recruiters enough context.");
  if (wc > 140) tips.push("Trim to under 120 words — recruiters scan, not read.");

  if (tips.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg px-3 py-2" style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Tip</p>
      <ul className="mt-1 space-y-0.5">
        {tips.map((tip, i) => (
          <li key={i} className="text-xs text-foreground-secondary">• {tip}</li>
        ))}
      </ul>
    </div>
  );
}

export default function CVEditor({ cv, onChange, onReset }: CVEditorProps) {
  const updateSummary = (summary: string) => {
    onChange({ ...cv, sections: { ...cv.sections, summary } });
  };

  const updateSkills = (value: string) => {
    onChange({
      ...cv,
      sections: { ...cv.sections, skills: linesToList(value) },
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

  const summaryCount = summaryCountLabel(cv.sections.summary);
  const activeSkills = cv.sections.skills.filter((s) => s.trim()).length;

  return (
    <div className="glass-panel rounded-xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid var(--surface-border)" }}>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Edit CV</h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            Adjust wording and emphasis. Contact info and education stay from
            your verified master CV.
          </p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            Reset to generated
          </button>
        )}
      </div>

      <div className="space-y-6 px-6 py-5">
        {/* Summary */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label
              htmlFor="cv-summary"
              className="block text-xs font-semibold uppercase tracking-wide text-foreground-secondary"
            >
              Professional summary
            </label>
            <span className={`text-[11px] font-medium ${summaryCount.color}`}>
              {summaryCount.label}
            </span>
          </div>
          <textarea
            id="cv-summary"
            value={cv.sections.summary}
            onChange={(e) => updateSummary(e.target.value)}
            rows={5}
            className="field-textarea"
          />
          <SummaryTip text={cv.sections.summary} />
        </div>

        {/* Skills */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label
              htmlFor="cv-skills"
              className="block text-xs font-semibold uppercase tracking-wide text-foreground-secondary"
            >
              Skills
            </label>
            <span
              className={`text-[11px] font-medium ${
                activeSkills < 5
                  ? "text-danger"
                  : activeSkills <= 15
                  ? "text-success"
                  : "text-warning"
              }`}
            >
              {activeSkills} skill{activeSkills !== 1 ? "s" : ""}
              {activeSkills < 5
                ? " — add more"
                : activeSkills > 20
                ? " — consider trimming"
                : " — good"}
            </span>
          </div>
          <textarea
            id="cv-skills"
            value={listToLines(cv.sections.skills)}
            onChange={(e) => updateSkills(e.target.value)}
            rows={6}
            className="field-textarea"
          />
          <p className="mt-1.5 text-xs text-foreground-tertiary">
            One skill per line · ranked by job relevance.
          </p>
        </div>

        {/* Experience bullets */}
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-secondary">
            Experience bullets
          </p>
          {cv.sections.experience.map((role, roleIdx) => (
            <div key={`${role.id}-${roleIdx}`} className="rounded-xl p-4" style={{ background: "var(--background-secondary)", border: "1px solid var(--surface-border)" }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{role.title}</p>
                <span className="text-xs text-foreground-tertiary">
                  {role.company} · {role.location}
                </span>
              </div>
              <textarea
                aria-label={`Bullets for ${role.title}`}
                value={listToLines(role.bullets)}
                onChange={(e) => updateBullets(role.id, e.target.value)}
                rows={Math.max(4, role.bullets.length + 1)}
                className="field-textarea mt-3"
              />
              <div className="mt-1.5 flex items-start justify-between gap-2">
                <p className="text-xs text-foreground-tertiary">One bullet per line.</p>
                <BulletQualityDots bullets={role.bullets} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
