import type { ParsedJob } from "@/types";

interface JobDetailsCardProps {
  job: ParsedJob;
  onSave?: () => void;
  savedMessage?: string | null;
}

function TagList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function JobDetailsCard({ job, onSave, savedMessage }: JobDetailsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Extracted Job Details
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{job.title}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>
                <span className="font-medium text-slate-700">Company:</span> {job.company}
              </span>
              <span>
                <span className="font-medium text-slate-700">Location:</span> {job.location}
              </span>
            </div>
          </div>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Save to Tracker
            </button>
          )}
        </div>
        {savedMessage && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {savedMessage}
          </p>
        )}
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-slate-900">Required Skills</h3>
          <div className="mt-3">
            <TagList
              items={job.skills}
              emptyLabel="No known skills detected in the posting text."
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-900">Tools & Technologies</h3>
          <div className="mt-3">
            <TagList
              items={job.tools}
              emptyLabel="No known tools or technologies detected."
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-900">Responsibilities</h3>
          <div className="mt-3">
            <BulletList
              items={job.responsibilities}
              emptyLabel="No responsibilities section detected. Add bullet points to the posting."
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-900">Requirements</h3>
          <div className="mt-3">
            <BulletList
              items={job.requirements}
              emptyLabel="No requirements section detected."
            />
          </div>
        </section>

        <section className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">ATS Keywords</h3>
          <div className="mt-3">
            <TagList
              items={job.atsKeywords}
              emptyLabel="No ATS keywords extracted."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
