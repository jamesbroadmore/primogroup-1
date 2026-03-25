/**
 * Perth timezone utilities (AWST = UTC+8)
 * All time display and date logic should use these helpers
 * to ensure consistency across the platform.
 */

const PERTH_TZ = "Australia/Perth";

/** Get current date in Perth as YYYY-MM-DD */
export function getPerthDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: PERTH_TZ });
}

/** Get current hour in Perth (0-23) */
export function getPerthHour(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: PERTH_TZ })
  ).getHours();
}

/** Format an ISO timestamp to Perth local time (e.g. "2:30 PM") */
export function formatPerthTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-AU", {
    timeZone: PERTH_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format an ISO timestamp to Perth local date (e.g. "9 Mar 2026") */
export function formatPerthDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-AU", {
    timeZone: PERTH_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO timestamp to Perth local date+time */
export function formatPerthDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-AU", {
    timeZone: PERTH_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Convert a Perth local date + time string to an ISO string
 *  e.g. ("2026-03-09", "14:30") => ISO string representing 14:30 AWST
 */
export function perthToISO(date: string, time: string): string {
  // AWST is UTC+8, so we subtract 8 hours
  const dt = new Date(`${date}T${time}:00+08:00`);
  return dt.toISOString();
}

/** Extract Perth local time (HH:MM) from an ISO string */
export function extractPerthTime(isoString: string | null): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("en-AU", {
    timeZone: PERTH_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Extract Perth local hour from an ISO string */
export function extractPerthHour(isoString: string): number {
  return parseInt(
    new Date(isoString).toLocaleString("en-AU", {
      timeZone: PERTH_TZ,
      hour: "2-digit",
      hour12: false,
    }),
    10
  );
}

/** Get time-of-day greeting for Perth */
export function getPerthGreeting(): string {
  const hour = getPerthHour();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
