interface CVFocusAreasProps {
  areas: string[];
}

export default function CVFocusAreas({ areas }: CVFocusAreasProps) {
  return (
    <div className="glass-card">
      <h3 className="text-base font-semibold text-foreground">
        Recommended CV Focus Areas
      </h3>
      <p className="mt-1 text-sm text-foreground-secondary">
        Suggestions based on verified master CV data only — never add unverified claims.
      </p>

      {areas.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-secondary">
          Analyze a job to see tailored focus recommendations.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {areas.map((area, index) => (
            <li
              key={`${area}-${index}`}
              className="flex gap-3 rounded-xl border border-border bg-background-secondary px-4 py-3 text-sm leading-relaxed text-foreground-secondary"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-dark">
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
