import { addDays, addMonths, endOfDay, endOfMonth, endOfWeek, formatISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";

export type Range = { timeMin: string; timeMax: string };

export function todayRange(now = new Date()): Range {
  return { timeMin: formatISO(startOfDay(now)), timeMax: formatISO(endOfDay(now)) };
}

export function thisWeekRange(now = new Date()): Range {
  return { timeMin: formatISO(startOfWeek(now)), timeMax: formatISO(endOfWeek(now)) };
}

export function thisMonthRange(now = new Date()): Range {
  return { timeMin: formatISO(startOfMonth(now)), timeMax: formatISO(endOfMonth(now)) };
}

export function customDaysRange(days: number, now = new Date()): Range {
  const from = startOfDay(now);
  const to = endOfDay(addDays(now, days));
  return { timeMin: formatISO(from), timeMax: formatISO(to) };
}

export function nextMonthsRange(months: number, now = new Date()): Range {
  const from = startOfDay(now);
  const to = endOfMonth(addMonths(now, months));
  return { timeMin: formatISO(from), timeMax: formatISO(to) };
}
