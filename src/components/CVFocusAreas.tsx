interface CVFocusAreasProps {
  areas: string[];
}

export default function CVFocusAreas({ areas }: CVFocusAreasProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        Recommended CV Focus Areas
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Suggestions based on verified master CV data only — never add unverified claims.
      </p>

      {areas.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Analyze a job to see tailored focus recommendations.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {areas.map((area) => (
            <li
              key={area}
              className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                ✓
              </span>
              <span>{area}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
