/**
 * Firestore security rules tests: direct client-SDK access must not bypass the API's
 * authorization, duplicate and capacity rules.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { PROJECT_ID } from "./helpers";

let env: RulesTestEnvironment;

beforeAll(async () => {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(":");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host, port: Number(port) },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/organizer-a"), { email: "o@x.test", displayName: "O", role: "organizer", organizationId: "org-a" });
    await setDoc(doc(db, "users/organizer-b"), { email: "b@x.test", displayName: "B", role: "organizer", organizationId: "org-b" });
    await setDoc(doc(db, "users/student-1"), { email: "s1@x.test", displayName: "S1", role: "student", organizationId: null });
    await setDoc(doc(db, "organizations/org-a"), { name: "Org A" });
    await setDoc(doc(db, "events/published"), { status: "published", organizationId: "org-a", capacity: 1, registeredCount: 0 });
    await setDoc(doc(db, "events/draft"), { status: "draft", organizationId: "org-a", capacity: 1, registeredCount: 0 });
    await setDoc(doc(db, "registrations/published_student-1"), {
      eventId: "published", userId: "student-1", organizationId: "org-a", status: "confirmed",
    });
  });
});

const asAnonymous = () => env.unauthenticatedContext().firestore();
const asUser = (uid: string, email = `${uid}@x.test`) => env.authenticatedContext(uid, { email }).firestore();

describe("events", () => {
  it("are publicly readable once published; drafts only by their organization's organizers", async () => {
    await assertSucceeds(getDoc(doc(asAnonymous(), "events/published")));
    await assertFails(getDoc(doc(asAnonymous(), "events/draft")));
    await assertFails(getDoc(doc(asUser("student-1"), "events/draft")));
    await assertFails(getDoc(doc(asUser("organizer-b"), "events/draft")));
    await assertSucceeds(getDoc(doc(asUser("organizer-a"), "events/draft")));
  });

  it("allow listing published events but not unfiltered queries that would include drafts", async () => {
    await assertSucceeds(getDocs(query(collection(asAnonymous(), "events"), where("status", "==", "published"))));
    await assertFails(getDocs(collection(asAnonymous(), "events")));
  });

  it("cannot be written from the client, even by organizers", async () => {
    await assertFails(updateDoc(doc(asUser("organizer-a"), "events/published"), { status: "cancelled" }));
    await assertFails(updateDoc(doc(asUser("student-1"), "events/published"), { registeredCount: 0, capacity: 999 }));
    await assertFails(setDoc(doc(asUser("organizer-a"), "events/new"), { status: "published", organizationId: "org-a" }));
    await assertFails(deleteDoc(doc(asUser("organizer-a"), "events/published")));
  });
});

describe("registrations", () => {
  it("are readable by their owner and by organizers of the event's organization only", async () => {
    await assertSucceeds(getDoc(doc(asUser("student-1"), "registrations/published_student-1")));
    await assertSucceeds(getDoc(doc(asUser("organizer-a"), "registrations/published_student-1")));
    await assertFails(getDoc(doc(asUser("student-2"), "registrations/published_student-1")));
    await assertFails(getDoc(doc(asUser("organizer-b"), "registrations/published_student-1")));
    await assertFails(getDoc(doc(asAnonymous(), "registrations/published_student-1")));
  });

  it("cannot be created or changed from the client (no capacity or duplicate bypass)", async () => {
    await assertFails(setDoc(doc(asUser("student-2"), "registrations/published_student-2"), {
      eventId: "published", userId: "student-2", organizationId: "org-a", status: "confirmed",
    }));
    await assertFails(updateDoc(doc(asUser("student-1"), "registrations/published_student-1"), { status: "cancelled" }));
  });
});

describe("user profiles", () => {
  it("can be created by the user only as a student", async () => {
    const profile = { email: "new@x.test", displayName: "New", role: "student", organizationId: null };
    await assertSucceeds(setDoc(doc(asUser("new", "new@x.test"), "users/new"), profile));
    await assertFails(setDoc(doc(asUser("evil", "evil@x.test"), "users/evil"), { ...profile, email: "evil@x.test", role: "admin" }));
    await assertFails(setDoc(doc(asUser("evil2", "evil2@x.test"), "users/evil2"), {
      ...profile, email: "evil2@x.test", role: "organizer", organizationId: "org-a",
    }));
    await assertFails(setDoc(doc(asUser("new", "new@x.test"), "users/someone-else"), profile));
  });

  it("allow changing the display name but never the role or organization", async () => {
    await assertSucceeds(updateDoc(doc(asUser("student-1"), "users/student-1"), { displayName: "Renamed" }));
    await assertFails(updateDoc(doc(asUser("student-1"), "users/student-1"), { role: "admin" }));
    await assertFails(updateDoc(doc(asUser("organizer-b"), "users/organizer-b"), { organizationId: "org-a" }));
  });

  it("are private to their owner", async () => {
    await assertSucceeds(getDoc(doc(asUser("student-1"), "users/student-1")));
    await assertFails(getDoc(doc(asUser("student-1"), "users/organizer-a")));
  });
});

describe("organizations", () => {
  it("are public to read and admin-only to write", async () => {
    await assertSucceeds(getDoc(doc(asAnonymous(), "organizations/org-a")));
    await assertFails(setDoc(doc(asUser("organizer-a"), "organizations/org-a"), { name: "Renamed" }));
  });
});
