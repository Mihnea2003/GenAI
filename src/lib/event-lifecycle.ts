export type EventStatus = "draft" | "published" | "completed" | "cancelled";

export const EVENT_STATUSES: readonly EventStatus[] = ["draft", "published", "completed", "cancelled"];

export type EventDraft = {
  title: string;
  description: string;
  /** ISO 8601 date-time. The API requires an explicit timezone (e.g. `Date#toISOString()`). */
  startDate: string;
  endDate: string;
  location: string;
  organizationId: string;
  capacity: number;
};

export type EventFieldError = { field: keyof EventDraft; message: string };

export type ValidateOptions = {
  now?: Date;
  /** New events and events being published must start in the future. Defaults to true. */
  requireFutureStart?: boolean;
};

export function validateEventDraftFields(draft: EventDraft, options: ValidateOptions = {}): EventFieldError[] {
  const { now = new Date(), requireFutureStart = true } = options;
  const errors: EventFieldError[] = [];
  const startDate = new Date(draft.startDate);
  const endDate = new Date(draft.endDate);

  if (!draft.title.trim()) errors.push({ field: "title", message: "Enter an event title." });
  if (!draft.description.trim()) errors.push({ field: "description", message: "Enter an event description." });
  if (!draft.location.trim()) errors.push({ field: "location", message: "Enter a location." });
  if (!draft.organizationId.trim()) {
    errors.push({ field: "organizationId", message: "Select an organizing organization." });
  }
  if (!Number.isInteger(draft.capacity) || draft.capacity < 1) {
    errors.push({ field: "capacity", message: "Capacity must be a positive whole number." });
  }
  if (Number.isNaN(startDate.getTime())) {
    errors.push({ field: "startDate", message: "Enter a valid start date and time." });
  } else if (requireFutureStart && startDate <= now) {
    errors.push({ field: "startDate", message: "The event must start in the future." });
  }
  if (Number.isNaN(endDate.getTime())) {
    errors.push({ field: "endDate", message: "Enter a valid end date and time." });
  } else if (!Number.isNaN(startDate.getTime()) && endDate <= startDate) {
    errors.push({ field: "endDate", message: "The end date must be after the start date." });
  }

  return errors;
}

/** Message-only variant used by the dashboard for quick client-side feedback. */
export function validateEventDraft(draft: EventDraft, now: Date = new Date()): string[] {
  return validateEventDraftFields(draft, { now }).map((error) => error.message);
}

export function canTransitionEventStatus(current: EventStatus, next: EventStatus): boolean {
  if (current === "draft") return next === "published" || next === "cancelled";
  if (current === "published") return next === "completed" || next === "cancelled";
  return false;
}

export function isTerminalStatus(status: EventStatus): boolean {
  return status === "completed" || status === "cancelled";
}
