export type EventStatus = "draft" | "published" | "completed" | "cancelled";

export type EventDraft = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organization: string;
  capacity: number;
};

export function validateEventDraft(draft: EventDraft, now: Date = new Date()): string[] {
  const errors: string[] = [];
  const startDate = new Date(draft.startDate);
  const endDate = new Date(draft.endDate);

  if (!draft.title.trim()) errors.push("Enter an event title.");
  if (!draft.description.trim()) errors.push("Enter an event description.");
  if (!draft.location.trim()) errors.push("Enter a location.");
  if (!draft.organization.trim()) errors.push("Select an organizing organization.");
  if (!Number.isInteger(draft.capacity) || draft.capacity < 1) {
    errors.push("Capacity must be a positive whole number.");
  }
  if (Number.isNaN(startDate.getTime())) {
    errors.push("Enter a valid start date and time.");
  } else if (startDate <= now) {
    errors.push("The event must start in the future.");
  }
  if (Number.isNaN(endDate.getTime())) {
    errors.push("Enter a valid end date and time.");
  } else if (!Number.isNaN(startDate.getTime()) && endDate <= startDate) {
    errors.push("The end date must be after the start date.");
  }

  return errors;
}

export function canTransitionEventStatus(current: EventStatus, next: EventStatus): boolean {
  if (current === "draft") return next === "published" || next === "cancelled";
  if (current === "published") return next === "completed" || next === "cancelled";
  return false;
}