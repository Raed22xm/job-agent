"use client";

import { useState } from "react";
import type { Application, CoverLetterStatus } from "@/types";

const coverLetterOptions: CoverLetterStatus[] = [
  "none",
  "draft",
  "ready",
  "sent",
];

const coverLetterLabels: Record<CoverLetterStatus, string> = {
  none: "None",
  draft: "Draft",
  ready: "Ready",
  sent: "Sent",
};

function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

interface ApplicationEditFieldsProps {
  app: Application;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<
        Application,
        | "notes"
        | "deadline"
        | "cvVersion"
        | "coverLetterStatus"
        | "recruiterContact"
        | "appliedDate"
        | "followUpDate"
        | "jobnetLogged"
        | "jobnetLoggedDate"
      >
    >
  ) => void;
  onClose: () => void;
}

export default function ApplicationEditFields({
  app,
  onUpdate,
  onClose,
}: ApplicationEditFieldsProps) {
  const [cvVersion, setCvVersion] = useState(app.cvVersion ?? "");
  const [coverLetterStatus, setCoverLetterStatus] = useState(
    app.coverLetterStatus
  );
  const [recruiterContact, setRecruiterContact] = useState(
    app.recruiterContact ?? ""
  );
  const [deadline, setDeadline] = useState(toDateInputValue(app.deadline));
  const [appliedDate, setAppliedDate] = useState(
    toDateInputValue(app.appliedDate)
  );
  const [followUpDate, setFollowUpDate] = useState(
    toDateInputValue(app.followUpDate)
  );
  const [notes, setNotes] = useState(app.notes ?? "");

  const handleSave = () => {
    onUpdate(app.id, {
      cvVersion: cvVersion.trim() || undefined,
      coverLetterStatus,
      recruiterContact: recruiterContact.trim() || undefined,
      deadline: deadline || undefined,
      appliedDate: appliedDate || undefined,
      followUpDate: followUpDate || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="space-y-4 rounded-lg p-4"
      style={{
        background: "var(--background-secondary)",
        border: "1px solid var(--surface-border)",
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label
            htmlFor={`cv-version-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            CV version
          </label>
          <input
            id={`cv-version-${app.id}`}
            type="text"
            value={cvVersion}
            onChange={(e) => setCvVersion(e.target.value)}
            placeholder="e.g. tailored-react-v2"
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`cover-letter-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Cover letter status
          </label>
          <select
            id={`cover-letter-${app.id}`}
            value={coverLetterStatus}
            onChange={(e) =>
              setCoverLetterStatus(e.target.value as CoverLetterStatus)
            }
            className="mt-1 field-input-compact"
          >
            {coverLetterOptions.map((status) => (
              <option key={status} value={status}>
                {coverLetterLabels[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`recruiter-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Recruiter contact
          </label>
          <input
            id={`recruiter-${app.id}`}
            type="text"
            value={recruiterContact}
            onChange={(e) => setRecruiterContact(e.target.value)}
            placeholder="Navn, email, telefon — auto-udfyldes fra jobopslag hvis muligt"
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`deadline-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Deadline
          </label>
          <input
            id={`deadline-${app.id}`}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`applied-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Applied date
          </label>
          <input
            id={`applied-${app.id}`}
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            className="mt-1 field-input-compact"
          />
        </div>
        <div>
          <label
            htmlFor={`followup-${app.id}`}
            className="text-xs font-medium text-foreground-secondary"
          >
            Follow-up date
          </label>
          <input
            id={`followup-${app.id}`}
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="mt-1 field-input-compact"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={`notes-${app.id}`}
          className="text-xs font-medium text-foreground-secondary"
        >
          Notes
        </label>
        <textarea
          id={`notes-${app.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Interview prep, feedback, next steps…"
          className="mt-1 field-input-compact resize-y"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary text-xs px-3 py-1.5"
        >
          Save details
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
