import { Timestamp } from "firebase-admin/firestore";
import type { UserProfile } from "@/lib/api-types";
import { adminAuth, adminDb } from "@/server/firebase-admin";
import type { EventDoc } from "@/server/events-service";

export const PROJECT_ID = "demo-ubbevents";
const firestoreHost = () => process.env.FIRESTORE_EMULATOR_HOST!;
const authHost = () => process.env.FIREBASE_AUTH_EMULATOR_HOST!;

export async function resetEmulators() {
  await fetch(`http://${firestoreHost()}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
    method: "DELETE",
  });
  await fetch(`http://${authHost()}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
}

export const DAY = 24 * 60 * 60 * 1000;
export const inDays = (days: number) => new Date(Date.now() + days * DAY);

export const organizer: UserProfile = {
  id: "organizer-a",
  email: "organizer.a@ubbevents.test",
  displayName: "Organizer A",
  role: "organizer",
  organizationId: "org-a",
};
export const otherOrganizer: UserProfile = { ...organizer, id: "organizer-b", email: "organizer.b@ubbevents.test", organizationId: "org-b" };
export const admin: UserProfile = { ...organizer, id: "admin-1", email: "admin@ubbevents.test", role: "admin", organizationId: null };
export const student = (n = 1): UserProfile => ({
  id: `student-${n}`,
  email: `student${n}@ubbevents.test`,
  displayName: `Student ${n}`,
  role: "student",
  organizationId: null,
});

/** Writes organizations and user profiles the tests rely on. */
export async function seedBaseData() {
  const db = adminDb();
  await db.collection("organizations").doc("org-a").set({ name: "Org A", description: "" });
  await db.collection("organizations").doc("org-b").set({ name: "Org B", description: "" });
  for (const user of [organizer, otherOrganizer, admin, student(1), student(2)]) {
    const { id, ...profile } = user;
    await db.collection("users").doc(id).set(profile);
  }
}

/** Inserts an event directly (bypassing validation) so tests can set up any state. */
export async function insertEvent(id: string, overrides: Partial<EventDoc> = {}) {
  const now = Timestamp.now();
  const doc: EventDoc = {
    organizationId: "org-a",
    organizationName: "Org A",
    title: "Seeded event",
    description: "Seeded for tests",
    startDate: Timestamp.fromDate(inDays(7)),
    endDate: Timestamp.fromDate(new Date(inDays(7).getTime() + 2 * 60 * 60 * 1000)),
    location: "Room 1",
    capacity: 10,
    registeredCount: 0,
    status: "published",
    createdBy: organizer.id,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  await adminDb().collection("events").doc(id).set(doc);
  return doc;
}

export async function readEvent(id: string) {
  return (await adminDb().collection("events").doc(id).get()).data() as EventDoc;
}

/** Creates an Auth-emulator account and returns a real Firebase ID token for it. */
export async function signUpAndGetIdToken(uid: string, email: string): Promise<string> {
  const password = "Passw0rd!";
  await adminAuth().createUser({ uid, email, password });
  const response = await fetch(
    `http://${authHost()}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const body = (await response.json()) as { idToken?: string };
  if (!body.idToken) throw new Error(`Auth emulator sign-in failed: ${JSON.stringify(body)}`);
  return body.idToken;
}
