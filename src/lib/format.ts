import type { EventDto } from "./api-types";

const LOCALE = "en-GB";

export function formatDayMonth(iso: string) {
  const date = new Date(iso);
  return {
    day: new Intl.DateTimeFormat(LOCALE, { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(date),
  };
}

/** "Mon, 12 Oct 2030 · 10:00–12:00", or a full range when the event spans several days. */
export function formatSchedule(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });
  if (start.toDateString() === end.toDateString()) {
    return `${day.format(start)} · ${time.format(start)}–${time.format(end)}`;
  }
  return `${day.format(start)} ${time.format(start)} – ${day.format(end)} ${time.format(end)}`;
}

/** Seat availability text, used on cards and the details page. */
export function capacityLabel(event: Pick<EventDto, "capacity" | "remainingCapacity" | "status">): string {
  if (event.status === "cancelled") return "Cancelled";
  if (event.remainingCapacity === 0) return `Full · ${event.capacity} seats`;
  if (event.remainingCapacity === 1) return "1 seat left";
  return `${event.remainingCapacity} of ${event.capacity} seats left`;
}
