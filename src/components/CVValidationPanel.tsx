import type { CVValidationIssue } from "@/types";

interface CVValidationPanelProps {
  issues: CVValidationIssue[];
}

export default function CVValidationPanel({ issues }: CVValidationPanelProps) {
  if (issues.length === 0) return null;

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return (
    <div
      className={`rounded-xl border px-5 py-4 ${
        errors.length > 0
          ? "border-danger/20 bg-danger/10"
          : "border-warning/20 bg-warning/10"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          errors.length > 0 ? "text-danger" : "text-warning"
        }`}
      >
        {errors.length > 0
          ? "CV validation issues — fix before applying"
          : "CV review warnings"}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {[...errors, ...warnings].map((issue) => (
          <li
            key={`${issue.field}-${issue.message}`}
            className={
              issue.severity === "error" ? "text-danger" : "text-warning/90"
            }
          >
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
