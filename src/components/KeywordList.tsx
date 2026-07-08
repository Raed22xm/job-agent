interface KeywordListProps {
  title: string;
  keywords: string[];
  variant: "matched" | "missing";
  emptyMessage?: string;
}

export default function KeywordList({
  title,
  keywords,
  variant,
  emptyMessage = "No keywords to display.",
}: KeywordListProps) {
  const badgeStyles =
    variant === "matched"
      ? "bg-success/10 text-emerald-800 border-success/20"
      : "bg-warning/10 text-warning border-warning/20";

  const countStyles =
    variant === "matched"
      ? "bg-success/15 text-success"
      : "bg-amber-100 text-warning";

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${countStyles}`}>
          {keywords.length}
        </span>
      </div>

      {keywords.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-secondary">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <li
              key={keyword}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeStyles}`}
            >
              {keyword}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
