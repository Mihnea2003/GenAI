import type { ApiErrorCode, UserProfile } from "./api-types";
import type { EventStatus } from "./event-lifecycle";

export type RegistrationBlockCode = Extract<
  ApiErrorCode,
  "EVENT_CANCELLED" | "EVENT_NOT_PUBLISHED" | "EVENT_CLOSED" | "REGISTRATION_CLOSED" | "EVENT_FULL"
>;

export const REGISTRATION_BLOCK_MESSAGES: Record<RegistrationBlockCode, string> = {
  EVENT_CANCELLED: "This event has been cancelled.",
  EVENT_NOT_PUBLISHED: "This event is not open for registration yet.",
  EVENT_CLOSED: "This event has already taken place.",
  REGISTRATION_CLOSED: "Registration closed when the event started.",
  EVENT_FULL: "This event is full.",
};

type RegistrableEvent = {
  status: EventStatus;
  startDate: Date;
  capacity: number;
  registeredCount: number;
};

/**
 * Decides whether a new registration may be created. Returns null when allowed.
 * The server evaluates this inside a Firestore transaction so the capacity check is atomic;
 * the UI may call it only to pre-render the right button state.
 */
export function registrationBlockReason(event: RegistrableEvent, now: Date = new Date()): RegistrationBlockCode | null {
  if (event.status === "cancelled") return "EVENT_CANCELLED";
  if (event.status === "draft") return "EVENT_NOT_PUBLISHED";
  if (event.status === "completed") return "EVENT_CLOSED";
  if (event.startDate <= now) return "REGISTRATION_CLOSED";
  if (event.registeredCount >= event.capacity) return "EVENT_FULL";
  return null;
}

type Actor = Pick<UserProfile, "role" | "organizationId">;

/** Organizers manage only their own organization; platform admins manage every organization. */
export function canManageOrganization(user: Actor | null, organizationId: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.role === "organizer" && user.organizationId === organizationId;
}

/** Drafts are visible only to the organization's organizers; other statuses are public. */
export function canViewEvent(user: Actor | null, event: { status: EventStatus; organizationId: string }): boolean {
  return event.status !== "draft" || canManageOrganization(user, event.organizationId);
}
