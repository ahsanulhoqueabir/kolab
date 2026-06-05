import { app } from "@/config/env.config";

/**
 * Get the configured timezone string (e.g., "Asia/Dhaka").
 */
export function getTimezone(): string {
  return app.timezone;
}

/**
 * Format a date string for display using the configured timezone.
 * Falls back to the browser's default locale if `Intl` is unavailable.
 *
 * @param dateStr - ISO date string or date-only string (e.g. "2026-06-05").
 *                  Accepts `null | undefined` – returns `"—"` in those cases.
 * @param options - Intl.DateTimeFormat options (defaults to a readable date)
 * @returns Formatted date string in the configured timezone (e.g. "Jun 5, 2026")
 *          or `"—"` when `dateStr` is null/undefined/empty.
 */
export function formatDateInTimezone(
  dateStr: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  if (!dateStr) return "—";
  try {
    const tz = getTimezone();
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: tz,
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date as a YYYY-MM-DD string in the configured timezone.
 * Useful for date-only comparisons (e.g., due_date comparisons).
 */
export function todayInTimezone(): string {
  const tz = getTimezone();
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Get a Date object set to 00:00:00 of today in the configured timezone.
 * Useful for comparing dates (e.g., "is due_date before today in BST?").
 */
export function todayStartInTimezone(): Date {
  const tz = getTimezone();
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  return new Date(get("year"), get("month") - 1, get("day"), 0, 0, 0, 0);
}

/**
 * Generate an ISO 8601 timestamp string in the configured timezone.
 * Uses `Asia/Dhaka` (BST) by default.
 *
 * Example output: "2026-06-05T14:30:00.000+06:00"
 *
 * NOTE: We construct this manually because Supabase/Postgres stores
 * timestamps without timezone info. By generating the timestamp in the
 * target timezone, we ensure consistency when reading/displaying.
 */
export function dbTimestamp(): string {
  const tz = getTimezone();
  const now = new Date();

  // Get the date parts in the target timezone
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    dateParts.find((p) => p.type === type)?.value || "00";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  // Calculate the UTC offset for the target timezone
  const utcDate = new Date(
    Date.UTC(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10),
    ),
  );
  const offsetMs = now.getTime() - utcDate.getTime();
  const offsetMinutes = Math.round(offsetMs / 60000);
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMins).padStart(2, "0")}`;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000${offsetStr}`;
}

/**
 * Get an ISO 8601 timestamp for 7 days ago in the configured timezone.
 * Useful for "recent activity" queries.
 */
export function dbTimestamp7DaysAgo(): string {
  const tz = getTimezone();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(sevenDaysAgo);

  const get = (type: string) =>
    dateParts.find((p) => p.type === type)?.value || "00";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  const utcDate = new Date(
    Date.UTC(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10),
    ),
  );
  const offsetMs = sevenDaysAgo.getTime() - utcDate.getTime();
  const offsetMinutes = Math.round(offsetMs / 60000);
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMins).padStart(2, "0")}`;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000${offsetStr}`;
}
