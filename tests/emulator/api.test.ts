/**
 * End-to-end tests of the route handlers with real Firebase ID tokens from the Auth emulator.
 * They prove authorization is enforced by the server, not by the UI.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { adminDb } from "@/server/firebase-admin";
import * as eventsRoute from "@/app/api/events/route";
import * as eventRoute from "@/app/api/events/[eventId]/route";
import * as registrationRoute from "@/app/api/events/[eventId]/registration/route";
import * as meRoute from "@/app/api/me/route";
import { insertEvent, readEvent, resetEmulators, seedBaseData, signUpAndGetIdToken } from "./helpers";

const BASE = "http://localhost:3000";

function call(path: string, { method = "GET", token, body }: { method?: string; token?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return new NextRequest(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
const ctx = (eventId: string) => ({ params: Promise.resolve({ eventId }) });

let organizerToken: string;
let studentToken: string;

beforeEach(async () => {
  await resetEmulators();
  await seedBaseData();
  // "organizer-a" already has an organizer profile in Firestore; "new-student" has none yet.
  organizerToken = await signUpAndGetIdToken("organizer-a", "organizer.a@ubbevents.test");
  studentToken = await signUpAndGetIdToken("new-student", "new.student@ubbevents.test");
  await insertEvent("e1", { capacity: 1 });
});

describe("authentication", () => {
  it("rejects mutations without a token and with a forged token", async () => {
    const anonymous = await registrationRoute.POST(call("/api/events/e1/registration", { method: "POST" }), ctx("e1"));
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });

    const forged = await eventRoute.PATCH(
      call("/api/events/e1", { method: "PATCH", token: "not-a-real-token", body: { title: "x" } }),
      ctx("e1"),
    );
    expect(forged.status).toBe(401);
  });

  it("creates a student profile on first sign-in; roles cannot be self-assigned", async () => {
    const response = await meRoute.GET(call("/api/me", { token: studentToken }));
    expect(await response.json()).toMatchObject({ user: { id: "new-student", role: "student", organizationId: null } });
    expect((await adminDb().collection("users").doc("new-student").get()).data()?.role).toBe("student");
  });
});

describe("organizer event update (persistent)", () => {
  it("lets the organizer update the event and rejects the same request from a student", async () => {
    const asStudent = await eventRoute.PATCH(
      call("/api/events/e1", { method: "PATCH", token: studentToken, body: { title: "Student edit" } }),
      ctx("e1"),
    );
    expect(asStudent.status).toBe(403);

    const asOrganizer = await eventRoute.PATCH(
      call("/api/events/e1", { method: "PATCH", token: organizerToken, body: { title: "Organizer edit", status: "cancelled" } }),
      ctx("e1"),
    );
    expect(asOrganizer.status).toBe(200);
    expect(await readEvent("e1")).toMatchObject({ title: "Organizer edit", status: "cancelled" });
  });

  it("creates an event through POST /api/events", async () => {
    const start = new Date(Date.now() + 5 * 86_400_000);
    const response = await eventsRoute.POST(call("/api/events", {
      method: "POST",
      token: organizerToken,
      body: {
        organizationId: "org-a", title: "New", description: "Desc", location: "Room",
        startDate: start.toISOString(), endDate: new Date(start.getTime() + 3_600_000).toISOString(),
        capacity: 20, status: "published",
      },
    }));
    expect(response.status).toBe(201);
    const { event } = await response.json();
    expect((await readEvent(event.id)).status).toBe("published");
  });

  it("returns a JSON validation error for a malformed body", async () => {
    const response = await eventsRoute.POST(
      new NextRequest(`${BASE}/api/events`, { method: "POST", headers: { Authorization: `Bearer ${organizerToken}` }, body: "{" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });
});

describe("student registration (persistent)", () => {
  it("registers, rejects a duplicate, and reports the event as full to others", async () => {
    const first = await registrationRoute.POST(call("/api/events/e1/registration", { method: "POST", token: studentToken }), ctx("e1"));
    expect(first.status).toBe(201);
    expect(await first.json()).toMatchObject({ registration: { userId: "new-student", status: "confirmed" } });

    const duplicate = await registrationRoute.POST(call("/api/events/e1/registration", { method: "POST", token: studentToken }), ctx("e1"));
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({ error: { code: "ALREADY_REGISTERED" } });

    const otherToken = await signUpAndGetIdToken("other-student", "other.student@ubbevents.test");
    const full = await registrationRoute.POST(call("/api/events/e1/registration", { method: "POST", token: otherToken }), ctx("e1"));
    expect(full.status).toBe(409);
    expect(await full.json()).toMatchObject({ error: { code: "EVENT_FULL" } });

    const status = await registrationRoute.GET(call("/api/events/e1/registration", { token: studentToken }), ctx("e1"));
    expect(await status.json()).toMatchObject({ registration: { status: "confirmed" } });
    expect((await readEvent("e1")).registeredCount).toBe(1);
  });

  it("lists published events publicly with remaining capacity", async () => {
    const response = await eventsRoute.GET(call("/api/events?q=seeded"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ events: [{ id: "e1", remainingCapacity: 1 }] });
  });
});
