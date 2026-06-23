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
