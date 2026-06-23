import Link from "next/link";

const features = [
  {
    title: "1. Job Analyzer",
    description: "Paste text or import a URL. Local scoring first, optional AI enhancement.",
    href: "/analyzer",
  },
  {
    title: "2. CV Generator",
    description: "Edit a tailored ATS CV from verified master data only.",
    href: "/cv",
  },
  {
    title: "3. Cover Letter",
    description: "Edit a short draft cover letter before export.",
    href: "/cover-letter",
  },
  {
    title: "4. Application Tracker",
    description: "Track status, dates, notes, and export a JSON backup.",
    href: "/tracker",
  },
  {
    title: "Job Guide",
    description: "Search methods, job boards, CV tips, and agent workflow.",
    href: "/guide",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Local-first v0.3
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Apply smarter with verified CV data — never auto-apply.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Paste or import a job, get a match score and tailored drafts, edit before
          export, then track applications locally. One predictable pipeline — you
          review every output before applying.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/analyzer"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Start with Job Analyzer
          </Link>
          <Link
            href="/guide"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Job search guide
          </Link>
          <Link
            href="/tracker"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Tracker
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Workflow</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-semibold text-amber-900">Important rules</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900/90">
          <li>Never invent experience, education, or skills.</li>
          <li>All outputs use verified data from <code className="text-xs">data/master-cv.json</code>.</li>
          <li>No auto-apply — review and approve every application manually.</li>
          <li>AI runs server-side when configured; local heuristics always available as fallback.</li>
        </ul>
      </section>
    </div>
  );
}
