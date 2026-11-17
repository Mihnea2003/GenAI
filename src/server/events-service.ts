import "server-only";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { CreateEventInput, EventDto, ListEventsFilters, Organization, UserProfile } from "@/lib/api-types";
import {
  EVENT_STATUSES,
  canTransitionEventStatus,
  isTerminalStatus,
  validateEventDraftFields,
  type EventDraft,
  type EventStatus,
} from "@/lib/event-lifecycle";
import { canManageOrganization, canViewEvent } from "@/lib/registration-rules";
import { adminDb } from "./firebase-admin";
import { ApiError, eventNotFound, forbidden, validationError } from "./errors";

export const EVENTS = "events";
export const ORGANIZATIONS = "organizations";

/** Firestore document shape for events/{eventId}. */
export type EventDoc = {
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  location: string;
  capacity: number;
  /** Number of confirmed registrations; only changed inside registration transactions. */
  registeredCount: number;
  status: EventStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const iso = (value: Timestamp | null | undefined) => (value ? value.toDate().toISOString() : null);

export function toEventDto(id: string, data: EventDoc): EventDto {
  return {
    id,
    organizationId: data.organizationId,
    organizationName: data.organizationName,
    title: data.title,
    description: data.description,
    startDate: data.startDate.toDate().toISOString(),
    endDate: data.endDate.toDate().toISOString(),
    location: data.location,
    capacity: data.capacity,
    registeredCount: data.registeredCount,
    remainingCapacity: Math.max(0, data.capacity - data.registeredCount),
    status: data.status,
    createdBy: data.createdBy,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  };
}

const snapshotToDto = (snapshot: DocumentSnapshot) => toEventDto(snapshot.id, snapshot.data() as EventDoc);

const byStartDate = (a: EventDto, b: EventDto) => a.startDate.localeCompare(b.startDate);

// ---------------------------------------------------------------------------
// Input parsing (requests are untrusted; types are checked before business rules)
// ---------------------------------------------------------------------------

const TEXT_FIELDS = ["title", "description", "location"] as const;
const DATE_FIELDS = ["startDate", "endDate"] as const;
const EDITABLE_FIELDS = new Set<string>([...TEXT_FIELDS, ...DATE_FIELDS, "capacity", "status"]);
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

type EventPatch = Partial<Omit<EventDraft, "organizationId">> & { status?: EventStatus };

function asObject(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw validationError("The request body must be a JSON object.");
  }
  return input as Record<string, unknown>;
}

function parsePatch(body: Record<string, unknown>): EventPatch {
  const patch: EventPatch = {};
  for (const field of TEXT_FIELDS) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string") throw validationError(`${field} must be a string.`, field);
    patch[field] = (body[field] as string).trim();
  }
  for (const field of DATE_FIELDS) {
    if (body[field] === undefined) continue;
    const value = body[field];
    if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
      throw validationError(`${field} must be an ISO 8601 date-time string.`, field);
    }
    if (!HAS_TIMEZONE.test(value)) {
      throw validationError(`${field} must include a timezone, e.g. the output of Date#toISOString().`, field);
    }
    patch[field] = new Date(value).toISOString();
  }
  if (body.capacity !== undefined) {
    if (typeof body.capacity !== "number") throw validationError("capacity must be a number.", "capacity");
    patch.capacity = body.capacity;
  }
  if (body.status !== undefined) {
    if (!EVENT_STATUSES.includes(body.status as EventStatus)) {
      throw validationError(`status must be one of: ${EVENT_STATUSES.join(", ")}.`, "status");
    }
    patch.status = body.status as EventStatus;
  }
  return patch;
}

function assertValid(draft: EventDraft, requireFutureStart: boolean) {
  const [first, ...rest] = validateEventDraftFields(draft, { requireFutureStart });
  if (first) throw validationError([first, ...rest].map((e) => e.message).join(" "), first.field);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Public listing: published events only, optionally filtered. */
export async function listPublishedEvents(filters: ListEventsFilters = {}, now = new Date()): Promise<EventDto[]> {
  let query = adminDb().collection(EVENTS).where("status", "==", "published");
  if (filters.organizationId) query = query.where("organizationId", "==", filters.organizationId);
  const snapshot = await query.get();

  // Firestore has no full-text search; for the MVP volume the text filter runs in memory.
  const needle = filters.q?.trim().toLocaleLowerCase() ?? "";
  return snapshot.docs
    .map(snapshotToDto)
    .filter((event) => filters.includePast || new Date(event.endDate) >= now)
    .filter((event) =>
      !needle ||
      [event.title, event.description, event.location, event.organizationName]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle),
    )
    .sort(byStartDate);
}

/** Organizer listing: every event (any status) of an organization the user manages. */
export async function listManagedEvents(user: UserProfile, organizationId?: string): Promise<EventDto[]> {
  const targetOrg = organizationId ?? user.organizationId ?? undefined;
  let query: FirebaseFirestore.Query = adminDb().collection(EVENTS);
  if (targetOrg) {
    if (!canManageOrganization(user, targetOrg)) throw forbidden("You are not an organizer for this organization.");
    query = query.where("organizationId", "==", targetOrg);
  } else if (user.role !== "admin") {
    throw forbidden("Only organizers can manage events.");
  }
  const snapshot = await query.get();
  return snapshot.docs.map(snapshotToDto).sort(byStartDate);
}

/** Event details. Drafts are reported as missing to anyone who cannot manage them. */
export async function getEvent(eventId: string, user: UserProfile | null): Promise<EventDto> {
  const snapshot = await adminDb().collection(EVENTS).doc(eventId).get();
  if (!snapshot.exists) throw eventNotFound();
  const event = snapshotToDto(snapshot);
  if (!canViewEvent(user, event)) throw eventNotFound();
  return event;
}

export async function listOrganizations(): Promise<Organization[]> {
  const snapshot = await adminDb().collection(ORGANIZATIONS).get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, name: doc.data().name ?? doc.id, description: doc.data().description ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createEvent(user: UserProfile, input: unknown, now = new Date()): Promise<EventDto> {
  const body = asObject(input);
  const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
  if (!organizationId) throw validationError("Select an organizing organization.", "organizationId");
  if (!canManageOrganization(user, organizationId)) {
    throw forbidden("You are not an organizer for this organization.");
  }

  const requestedStatus = (body.status ?? "draft") as CreateEventInput["status"];
  if (requestedStatus !== "draft" && requestedStatus !== "published") {
    throw validationError("A new event can only be saved as draft or published.", "status");
  }
  const patch = parsePatch({ ...body, status: undefined });
  const draft: EventDraft = {
    title: patch.title ?? "",
    description: patch.description ?? "",
    startDate: patch.startDate ?? "",
    endDate: patch.endDate ?? "",
    location: patch.location ?? "",
    capacity: patch.capacity ?? NaN,
    organizationId,
  };
  assertValid(draft, true);

  const db = adminDb();
  const organization = await db.collection(ORGANIZATIONS).doc(organizationId).get();
  if (!organization.exists) {
    throw new ApiError(400, "ORGANIZATION_NOT_FOUND", "The selected organization does not exist.", "organizationId");
  }

  const timestamp = Timestamp.fromDate(now);
  const doc: EventDoc = {
    organizationId,
    organizationName: organization.data()?.name ?? organizationId,
    title: draft.title,
    description: draft.description,
    startDate: Timestamp.fromDate(new Date(draft.startDate)),
    endDate: Timestamp.fromDate(new Date(draft.endDate)),
    location: draft.location,
    capacity: draft.capacity,
    registeredCount: 0,
    status: requestedStatus,
    createdBy: user.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const ref = await db.collection(EVENTS).add(doc);
  return toEventDto(ref.id, doc);
}

/**
 * Updates event details and/or status. Runs in a transaction so the capacity check
 * cannot race with concurrent registrations.
 */
export async function updateEvent(user: UserProfile, eventId: string, input: unknown, now = new Date()): Promise<EventDto> {
  const body = asObject(input);
  if (body.organizationId !== undefined) {
    throw validationError("An event cannot be moved to another organization.", "organizationId");
  }
  const unknownField = Object.keys(body).find((key) => !EDITABLE_FIELDS.has(key));
  if (unknownField) throw validationError(`${unknownField} cannot be updated.`, unknownField);
  const patch = parsePatch(body);
  if (Object.keys(patch).length === 0) throw validationError("Provide at least one field to update.");

  const db = adminDb();
  const ref = db.collection(EVENTS).doc(eventId);

  return db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw eventNotFound();
    const current = snapshot.data() as EventDoc;

    if (!canManageOrganization(user, current.organizationId)) {
      if (current.status === "draft") throw eventNotFound();
      throw forbidden("You are not an organizer for this event's organization.");
    }
    if (isTerminalStatus(current.status)) {
      throw new ApiError(409, "EVENT_LOCKED", `This event is ${current.status} and can no longer be changed.`);
    }

    const nextStatus = patch.status ?? current.status;
    if (nextStatus !== current.status && !canTransitionEventStatus(current.status, nextStatus)) {
      throw new ApiError(
        400,
        "INVALID_STATUS_TRANSITION",
        `An event cannot move from ${current.status} to ${nextStatus}.`,
        "status",
      );
    }

    const merged: EventDraft = {
      title: patch.title ?? current.title,
      description: patch.description ?? current.description,
      startDate: patch.startDate ?? current.startDate.toDate().toISOString(),
      endDate: patch.endDate ?? current.endDate.toDate().toISOString(),
      location: patch.location ?? current.location,
      capacity: patch.capacity ?? current.capacity,
      organizationId: current.organizationId,
    };
    // Moving an event's start (or publishing it) requires a future start; unrelated edits to an
    // ongoing published event (e.g. fixing a typo) do not.
    const startChanged =
      patch.startDate !== undefined && new Date(patch.startDate).getTime() !== current.startDate.toMillis();
    const publishing = current.status === "draft" && nextStatus === "published";
    assertValid(merged, startChanged || publishing);

    if (merged.capacity < current.registeredCount) {
      throw validationError(
        `Capacity cannot be lower than the ${current.registeredCount} confirmed registrations.`,
        "capacity",
      );
    }

    const updated: EventDoc = {
      ...current,
      title: merged.title,
      description: merged.description,
      startDate: Timestamp.fromDate(new Date(merged.startDate)),
      endDate: Timestamp.fromDate(new Date(merged.endDate)),
      location: merged.location,
      capacity: merged.capacity,
      status: nextStatus,
      updatedAt: Timestamp.fromDate(now),
    };
    tx.set(ref, updated);
    return toEventDto(eventId, updated);
  });
}
