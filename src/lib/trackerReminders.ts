import type { Application } from "@/types";

export type ReminderKind = "deadline" | "followUp";

export interface ApplicationReminder {
  application: Application;
  kind: ReminderKind;
  date: string;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(start);
  monday.setDate(start.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function isDateInRange(
  isoDate: string | undefined,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  if (!isoDate?.trim()) return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= rangeStart && parsed <= rangeEnd;
}

export function isDueThisWeek(isoDate: string | undefined, now = new Date()): boolean {
  const start = startOfDay(now);
  const end = endOfWeek(now);
  return isDateInRange(isoDate, start, end);
}

export function isOverdue(isoDate: string | undefined, now = new Date()): boolean {
  if (!isoDate?.trim()) return false;
  const parsed = startOfDay(new Date(isoDate));
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed < startOfDay(now);
}

export function collectApplicationReminders(
  applications: Application[],
  now = new Date()
): ApplicationReminder[] {
  const reminders: ApplicationReminder[] = [];

  for (const application of applications) {
    if (
      application.deadline &&
      (isDueThisWeek(application.deadline, now) ||
        isOverdue(application.deadline, now))
    ) {
      reminders.push({
        application,
        kind: "deadline",
        date: application.deadline,
      });
    }

    if (
      application.followUpDate &&
      (isDueThisWeek(application.followUpDate, now) ||
        isOverdue(application.followUpDate, now))
    ) {
      reminders.push({
        application,
        kind: "followUp",
        date: application.followUpDate,
      });
    }
  }

  return reminders.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function filterApplicationsDueThisWeek(
  applications: Application[],
  now = new Date()
): Application[] {
  return applications.filter(
    (app) =>
      isDueThisWeek(app.deadline, now) ||
      isDueThisWeek(app.followUpDate, now) ||
      isOverdue(app.deadline, now) ||
      isOverdue(app.followUpDate, now)
  );
}

// ── Follow-up email automation ──────────────────────────────────────────────

const FOLLOW_UP_DAYS = 7;

export interface FollowUpDraft {
  applicationId: string;
  subject: string;
  body: string;
  daysSinceApplied: number;
}

/** Returns applications that were applied 7+ days ago without a follow-up date set. */
export function getApplicationsNeedingFollowUp(
  applications: Application[],
  now = new Date()
): Application[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - FOLLOW_UP_DAYS);

  return applications.filter((app) => {
    if (app.status !== "applied") return false;
    if (app.followUpDate) return false;
    if (!app.appliedDate?.trim()) return false;

    const applied = new Date(app.appliedDate);
    if (Number.isNaN(applied.getTime())) return false;

    return applied <= cutoff;
  });
}

/** Generates a personalized follow-up email from verified application data. */
export function generateFollowUpEmail(
  app: Application,
  candidateName: string,
  topSkills: string[] = [],
  portfolioUrl?: string,
  now = new Date()
): FollowUpDraft {
  const daysSince = app.appliedDate
    ? Math.floor(
        (now.getTime() - new Date(app.appliedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : FOLLOW_UP_DAYS;

  const company = app.company || "your company";
  const jobTitle = app.jobTitle || "the role";
  const skillMention =
    topSkills.length > 0
      ? topSkills.slice(0, 3).join(", ")
      : "my technical background";

  const subject = `Following up: ${jobTitle} application – ${candidateName}`;

  const body = `Hi,

I hope you are having a great week.

I am reaching out to reaffirm my interest in the ${jobTitle} role${company !== "your company" ? ` at ${company}` : ""} that I applied for${app.appliedDate ? ` on ${app.appliedDate}` : " recently"}.

My experience with ${skillMention} aligns well with the requirements outlined in the posting, and I remain enthusiastic about the opportunity to contribute to your team.

Please let me know if there is any additional information or work samples I can provide to assist in your review process.${portfolioUrl ? `\n\nPortfolio: ${portfolioUrl}` : ""}

Thank you for your time and consideration.

Best regards,
${candidateName}`;

  return { applicationId: app.id, subject, body, daysSinceApplied: daysSince };
}
