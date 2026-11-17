import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import type { EventRegistrationDto, MyRegistrationDto, RegistrationDto, RegistrationStatus, UserProfile } from "@/lib/api-types";
import { REGISTRATION_BLOCK_MESSAGES, canManageOrganization, registrationBlockReason } from "@/lib/registration-rules";
import { adminDb } from "./firebase-admin";
import { ApiError, eventNotFound, forbidden } from "./errors";
import { EVENTS, toEventDto, type EventDoc } from "./events-service";

export const REGISTRATIONS = "registrations";

/** Firestore document shape for registrations/{eventId}_{userId}. */
export type RegistrationDoc = {
  eventId: string;
  userId: string;
  /** Copied from the event so security rules can authorize organizers without an extra read. */
  organizationId: string;
  status: RegistrationStatus;
  registeredAt: Timestamp;
  cancelledAt: Timestamp | null;
  userEmail: string;
  userDisplayName: string;
};

/** Deterministic id: one document per (event, user) pair makes duplicates impossible. */
export const registrationId = (eventId: string, userId: string) => `${eventId}_${userId}`;

function toRegistrationDto(id: string, data: RegistrationDoc): RegistrationDto {
  return {
    id,
    eventId: data.eventId,
    userId: data.userId,
    status: data.status,
    registeredAt: data.registeredAt.toDate().toISOString(),
    cancelledAt: data.cancelledAt ? data.cancelledAt.toDate().toISOString() : null,
  };
}

/**
 * Registers the user for an event. The event read, duplicate check, capacity check, registration
 * write and counter increment happen in one Firestore transaction, so two students can never
 * take the last seat at the same time.
 */
export async function registerForEvent(user: UserProfile, eventId: string, now = new Date()): Promise<RegistrationDto> {
  const db = adminDb();
  const eventRef = db.collection(EVENTS).doc(eventId);
  const id = registrationId(eventId, user.id);
  const registrationRef = db.collection(REGISTRATIONS).doc(id);

  return db.runTransaction(async (tx) => {
    const [eventSnap, registrationSnap] = await tx.getAll(eventRef, registrationRef);
    if (!eventSnap.exists) throw eventNotFound();
    const event = eventSnap.data() as EventDoc;

    if (registrationSnap.exists && (registrationSnap.data() as RegistrationDoc).status === "confirmed") {
      throw new ApiError(409, "ALREADY_REGISTERED", "You are already registered for this event.");
    }

    const blocked = registrationBlockReason({ ...event, startDate: event.startDate.toDate() }, now);
    if (blocked) throw new ApiError(409, blocked, REGISTRATION_BLOCK_MESSAGES[blocked]);

    const registration: RegistrationDoc = {
      eventId,
      userId: user.id,
      organizationId: event.organizationId,
      status: "confirmed",
      registeredAt: Timestamp.fromDate(now),
      cancelledAt: null,
      userEmail: user.email,
      userDisplayName: user.displayName,
    };
    // A previously cancelled registration is reused, so the student can register again.
    tx.set(registrationRef, registration);
    tx.update(eventRef, { registeredCount: event.registeredCount + 1, updatedAt: Timestamp.fromDate(now) });
    return toRegistrationDto(id, registration);
  });
}

/** Cancels the user's confirmed registration and frees the seat atomically. */
export async function cancelRegistration(user: UserProfile, eventId: string, now = new Date()): Promise<RegistrationDto> {
  const db = adminDb();
  const eventRef = db.collection(EVENTS).doc(eventId);
  const id = registrationId(eventId, user.id);
  const registrationRef = db.collection(REGISTRATIONS).doc(id);

  return db.runTransaction(async (tx) => {
    const [eventSnap, registrationSnap] = await tx.getAll(eventRef, registrationRef);
    if (!eventSnap.exists) throw eventNotFound();
    const event = eventSnap.data() as EventDoc;
    const existing = registrationSnap.data() as RegistrationDoc | undefined;

    if (!existing || existing.status !== "confirmed") {
      throw new ApiError(404, "NOT_REGISTERED", "You do not have an active registration for this event.");
    }
    if (event.status === "completed") {
      throw new ApiError(409, "EVENT_CLOSED", "This event has already taken place.");
    }

    const cancelled: RegistrationDoc = { ...existing, status: "cancelled", cancelledAt: Timestamp.fromDate(now) };
    tx.set(registrationRef, cancelled);
    tx.update(eventRef, {
      registeredCount: Math.max(0, event.registeredCount - 1),
      updatedAt: Timestamp.fromDate(now),
    });
    return toRegistrationDto(id, cancelled);
  });
}

/** The user's registration for one event, or null if they never registered. */
export async function getMyRegistration(user: UserProfile, eventId: string): Promise<RegistrationDto | null> {
  const snapshot = await adminDb().collection(REGISTRATIONS).doc(registrationId(eventId, user.id)).get();
  return snapshot.exists ? toRegistrationDto(snapshot.id, snapshot.data() as RegistrationDoc) : null;
}

/** All of the user's registrations (confirmed and cancelled) with their events. */
export async function listMyRegistrations(user: UserProfile): Promise<MyRegistrationDto[]> {
  const db = adminDb();
  const snapshot = await db.collection(REGISTRATIONS).where("userId", "==", user.id).get();
  if (snapshot.empty) return [];

  const registrations = snapshot.docs.map((doc) => doc.data() as RegistrationDoc);
  const eventSnaps = await db.getAll(...registrations.map((r) => db.collection(EVENTS).doc(r.eventId)));
  const events = new Map(eventSnaps.filter((s) => s.exists).map((s) => [s.id, toEventDto(s.id, s.data() as EventDoc)]));

  return snapshot.docs
    .map((doc, index) => {
      const event = events.get(registrations[index].eventId) ?? null;
      // A registration for a draft event is impossible, but never leak drafts just in case.
      return { ...toRegistrationDto(doc.id, registrations[index]), event: event?.status === "draft" ? null : event };
    })
    .sort((a, b) => (a.event?.startDate ?? "").localeCompare(b.event?.startDate ?? ""));
}

/** Participant list for organizers of the event's organization. */
export async function listEventRegistrations(user: UserProfile, eventId: string): Promise<EventRegistrationDto[]> {
  const db = adminDb();
  const eventSnap = await db.collection(EVENTS).doc(eventId).get();
  if (!eventSnap.exists) throw eventNotFound();
  const event = eventSnap.data() as EventDoc;
  if (!canManageOrganization(user, event.organizationId)) {
    throw forbidden("Only organizers of this event's organization can view its participants.");
  }

  const snapshot = await db.collection(REGISTRATIONS).where("eventId", "==", eventId).get();
  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as RegistrationDoc;
      return { ...toRegistrationDto(doc.id, data), userEmail: data.userEmail, userDisplayName: data.userDisplayName };
    })
    .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
}
