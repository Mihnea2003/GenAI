/**
 * Shared API contract between the trusted server layer (src/server, src/app/api)
 * and the browser (organizer dashboard, student pages). See docs/backend-api.md.
 */
import type { EventDraft, EventStatus } from "./event-lifecycle";

export type UserRole = "student" | "organizer" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** The organization an organizer manages. Always null for students. */
  organizationId: string | null;
};

export type Organization = {
  id: string;
  name: string;
  description: string;
};

export type EventDto = {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registeredCount: number;
  remainingCapacity: number;
  status: EventStatus;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RegistrationStatus = "confirmed" | "cancelled";

export type RegistrationDto = {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt: string | null;
};

/** A student's own registration together with the event it belongs to. */
export type MyRegistrationDto = RegistrationDto & { event: EventDto | null };

/** A registration as seen by an organizer of the event. */
export type EventRegistrationDto = RegistrationDto & {
  userEmail: string;
  userDisplayName: string;
};

export type CreateEventInput = EventDraft & { status?: "draft" | "published" };

export type UpdateEventInput = Partial<Omit<EventDraft, "organizationId">> & { status?: EventStatus };

export type ListEventsFilters = {
  /** Case-insensitive text search over title, description, location and organization name. */
  q?: string;
  organizationId?: string;
  /** By default events that have already ended are hidden. */
  includePast?: boolean;
};

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "EVENT_NOT_FOUND"
  | "ORGANIZATION_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "EVENT_LOCKED"
  | "EVENT_NOT_PUBLISHED"
  | "EVENT_CANCELLED"
  | "EVENT_CLOSED"
  | "REGISTRATION_CLOSED"
  | "EVENT_FULL"
  | "ALREADY_REGISTERED"
  | "NOT_REGISTERED"
  | "INTERNAL";

export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; field?: string };
};
