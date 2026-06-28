"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildJobnetLogClipboardText,
  buildJobnetLogEntry,
  groupJobnetFieldsBySection,
  JOBNET_SECTION_ORDER,
  type JobnetLogField,
} from "@/lib/jobnet/buildJobnetLogEntry";
import type { Application } from "@/types";

interface JobnetLogPanelProps {
  application: Application;
  jobnetLogged?: boolean;
  jobnetLoggedDate?: string;
  onMarkLogged: (logged: boolean, loggedDate?: string) => void;
}

function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function FieldRow({
  field,
  copiedKey,
  onCopy,
}: {
  field: JobnetLogField;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  if (field.fieldType === "info") {
    return (
      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span className="font-medium text-slate-700">{field.label}:</span>{" "}
        {field.value}
      </div>
    );
  }

  if (field.fieldType === "upload") {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
        <div>
          <p className="text-xs font-medium text-slate-700">{field.label}</p>
          <p className="mt-0.5 text-sm text-slate-600">{field.value}</p>
        </div>
        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
          Upload på Jobnet
        </span>
      </div>
    );
  }

  const copyValue =
    field.fieldType === "radio" && field.options
      ? field.value
      : field.value;

  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <dt className="text-xs font-medium text-slate-700">
          {field.label}
          {field.required ? " *" : ""}
        </dt>
        {field.fieldType === "radio" && field.options ? (
          <dd className="mt-1 flex flex-wrap gap-2">
            {field.options.map((option) => (
              <span
                key={option}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  option === field.value
                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {option}
                {option === field.value ? " ← vælg" : ""}
              </span>
            ))}
          </dd>
        ) : (
          <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-900">
            {field.value || <span className="text-slate-400">— udfyld på Jobnet</span>}
          </dd>
        )}
        {field.hint && (
          <p className="mt-1 text-xs text-amber-700">{field.hint}</p>
        )}
      </div>
      {copyValue && field.fieldType !== "radio" && (
        <button
          type="button"
          onClick={() => onCopy(field.key, copyValue)}
          className="self-start rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {copiedKey === field.key ? "Kopieret" : "Kopiér"}
        </button>
      )}
      {field.fieldType === "radio" && field.value && (
        <button
          type="button"
          onClick={() => onCopy(field.key, field.value)}
          className="self-start rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {copiedKey === field.key ? "Kopieret" : "Kopiér valg"}
        </button>
      )}
    </div>
  );
}

export default function JobnetLogPanel({
  application,
  jobnetLogged = false,
  jobnetLoggedDate,
  onMarkLogged,
}: JobnetLogPanelProps) {
  const [portfolioUrl, setPortfolioUrl] = useState<string | undefined>();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [logged, setLogged] = useState(jobnetLogged);
  const [loggedDate, setLoggedDate] = useState(
    toDateInputValue(jobnetLoggedDate) || toDateInputValue(new Date().toISOString())
  );

  useEffect(() => {
    setLogged(jobnetLogged);
    setLoggedDate(
      toDateInputValue(jobnetLoggedDate) ||
        toDateInputValue(new Date().toISOString())
    );
    setCopiedKey(null);
  }, [application.id, application.updatedAt, application.jobTitle, application.company, jobnetLogged, jobnetLoggedDate]);

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      try {
        const response = await fetch("/api/cv-meta");
        if (!response.ok) return;
        const data = (await response.json()) as { portfolio?: string };
        if (!cancelled && data.portfolio) {
          setPortfolioUrl(data.portfolio);
        }
      } catch {
        // Optional metadata only
      }
    }

    void loadPortfolio();
    return () => {
      cancelled = true;
    };
  }, []);

  const entry = useMemo(
    () => buildJobnetLogEntry(application, { portfolioUrl }),
    [application, portfolioUrl]
  );

  const groupedFields = useMemo(
    () => groupJobnetFieldsBySection(entry.fields),
    [entry.fields]
  );

  const handleCopy = async (key: string, value: string) => {
    const ok = await copyText(value);
    if (ok) {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const handleCopyAll = async () => {
    await handleCopy("all", buildJobnetLogClipboardText(entry));
  };

  const handleSaveLogged = () => {
    onMarkLogged(logged, logged ? loggedDate || undefined : undefined);
  };

  return (
    <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-emerald-950">
            {application.jobTitle} · {application.company}
          </h3>
          <p className="mt-1 text-xs text-emerald-900/80">
            Felterne følger samme rækkefølge som Jobnet-formularen — scroll ned
            på Jobnet og kopiér undervejs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCopyAll()}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          {copiedKey === "all" ? "Kopieret!" : "Kopiér alle felter"}
        </button>
      </div>

      {entry.missingRequired.length > 0 && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          <p className="font-semibold">Mangler — udfyld manuelt på Jobnet:</p>
          <ul className="mt-1 list-inside list-disc">
            {entry.missingRequired.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {JOBNET_SECTION_ORDER.map((section) => {
          const fields = groupedFields.get(section) ?? [];
          if (fields.length === 0) return null;

          return (
            <section
              key={section}
              className="rounded-lg border border-emerald-100 bg-white p-3"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                {section}
              </h4>
              <dl className="mt-2 space-y-3">
                {fields.map((item) => (
                  <FieldRow
                    key={item.key}
                    field={item}
                    copiedKey={copiedKey}
                    onCopy={(key, value) => void handleCopy(key, value)}
                  />
                ))}
              </dl>
            </section>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-emerald-100 bg-white p-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={logged}
            onChange={(e) => setLogged(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Logget på Jobnet
        </label>
        {logged && (
          <div>
            <label
              htmlFor={`jobnet-date-${application.id}`}
              className="text-xs font-medium text-slate-700"
            >
              Dato logget
            </label>
            <input
              id={`jobnet-date-${application.id}`}
              type="date"
              value={loggedDate}
              onChange={(e) => setLoggedDate(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none ring-emerald-500 focus:ring-2"
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleSaveLogged}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          Gem Jobnet-status
        </button>
      </div>
    </div>
  );
}
