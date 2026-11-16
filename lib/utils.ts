import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Today", "Tomorrow", "Nov 18", "Mar 4, 2027" */
export function dayLabel(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  return format(d, d.getFullYear() === new Date().getFullYear() ? "MMM d" : "MMM d, yyyy");
}

/** Signed days until a date: negative when overdue. */
export function daysUntil(iso: string) {
  return differenceInCalendarDays(new Date(iso), new Date());
}

export function ago(iso: string) {
  const d = new Date(iso);
  const mins = (Date.now() - d.getTime()) / 60000;
  if (mins < 1) return "just now";
  return formatDistanceToNowStrict(d, { addSuffix: true })
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d");
}

export function dateTime(iso: string) {
  return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
}

export function fileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

export function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** ISO date n days from now. */
export const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString();

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
