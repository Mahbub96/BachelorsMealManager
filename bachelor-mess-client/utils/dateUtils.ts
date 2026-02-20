/**
 * Reusable date/time formatting and parsing.
 * Use for API payloads (YYYY-MM-DD) and display (locale-aware).
 */

/** Format Date as YYYY-MM-DD for the calendar day (timezone-safe for API). */
export function toLocalDateString(d: Date): string {
  const atNoon = new Date(d.getTime() + 12 * 60 * 60 * 1000);
  const y = atNoon.getUTCFullYear();
  const m = atNoon.getUTCMonth() + 1;
  const day = atNoon.getUTCDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Parse YYYY-MM-DD as noon UTC so picker and logic avoid midnight boundary. */
export function dateStringToDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T12:00:00.000Z');
  }
  return new Date(dateStr);
}

const defaultDateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/** Format ISO date string for display (e.g. "Friday, February 21, 2026"). */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = defaultDateOptions
): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

/** Format ISO date string as time only (e.g. "3:45 PM"). */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format as short date + short time (e.g. "2/21/26, 3:45 PM"). */
export function formatDateTimeShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/** Format as "Feb 21, 2026 · 3:45 PM" for consistent card/detail display. */
export function formatDateAndTime(dateString: string): string {
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}

/** Format meal date (e.g. "Fri, Feb 21"). */
export function formatMealDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
