import Link from "next/link";

const features = [
  {
    title: "Job Analyzer",
    description: "Extract title, company, skills, and ATS keywords from any posting.",
    href: "/analyzer",
  },
  {
    title: "CV Generator",
    description: "Tailor a one-column ATS CV using only verified master CV data.",
    href: "/cv",
  },
  {
    title: "Cover Letter",
    description: "Generate a short draft cover letter for human review.",
    href: "/cover-letter",
  },
  {
    title: "Application Tracker",
    description: "Save jobs locally and track application status.",
    href: "/tracker",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Local-first v0.2
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Apply smarter with verified CV data — never auto-apply.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Job Agent helps you analyze postings, score ATS keyword match against your master CV,
          generate tailored documents, and track applications — all with human approval before
          anything is sent.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/analyzer"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Start with Job Analyzer
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
          <li>OpenAI integration is not connected in this first version.</li>
        </ul>
      </section>
    </div>
  );
}
