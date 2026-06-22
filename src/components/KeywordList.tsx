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
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-amber-50 text-amber-800 border-amber-200";

  const countStyles =
    variant === "matched"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${countStyles}`}>
          {keywords.length}
        </span>
      </div>

      {keywords.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
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
