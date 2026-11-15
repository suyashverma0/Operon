import type { RelativeDate } from './schemas';

export interface DateRange {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
}

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function localYmd(d: Date, tz: string): { y: number; m: number; d: number } {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d); // YYYY-MM-DD
  const [y, m, day] = s.split('-').map(Number) as [number, number, number];
  return { y, m, d: day };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

/**
 * Deterministically resolves the model's relative-date label using the
 * backend-supplied reference instant and timezone (the model never computes dates).
 * "last_week" = previous calendar week (Mon–Sun); "last_month" = previous calendar month.
 */
export function resolveRelativeDate(rel: RelativeDate, reference: Date, timezone: string): DateRange {
  const { y, m, d } = localYmd(reference, timezone);
  const today = new Date(Date.UTC(y, m - 1, d));
  switch (rel) {
    case 'today':
      return { from: iso(today), to: iso(today) };
    case 'yesterday': {
      const v = iso(addDays(today, -1));
      return { from: v, to: v };
    }
    case 'day_before_yesterday': {
      const v = iso(addDays(today, -2));
      return { from: v, to: v };
    }
    case 'last_week': {
      const sinceMonday = (today.getUTCDay() + 6) % 7;
      const thisMonday = addDays(today, -sinceMonday);
      return { from: iso(addDays(thisMonday, -7)), to: iso(addDays(thisMonday, -1)) };
    }
    case 'last_month': {
      const first = new Date(Date.UTC(y, m - 2, 1));
      const last = new Date(Date.UTC(y, m - 1, 0));
      return { from: iso(first), to: iso(last) };
    }
  }
}
