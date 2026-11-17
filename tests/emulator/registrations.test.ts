import { beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/server/firebase-admin";
import {
  cancelRegistration,
  getMyRegistration,
  listEventRegistrations,
  listMyRegistrations,
  registerForEvent,
} from "@/server/registrations-service";
import { inDays, insertEvent, organizer, otherOrganizer, readEvent, resetEmulators, seedBaseData, student } from "./helpers";

beforeEach(async () => {
  await resetEmulators();
  await seedBaseData();
});

describe("registerForEvent", () => {
  it("creates a confirmed registration and increments the counter", async () => {
    await insertEvent("e1", { capacity: 5 });
    const registration = await registerForEvent(student(1), "e1");
    expect(registration).toMatchObject({ id: "e1_student-1", status: "confirmed", cancelledAt: null });
    expect((await readEvent("e1")).registeredCount).toBe(1);
    expect(await getMyRegistration(student(1), "e1")).toMatchObject({ status: "confirmed" });
  });

  it("prevents duplicate registrations", async () => {
    await insertEvent("e1");
    await registerForEvent(student(1), "e1");
    await expect(registerForEvent(student(1), "e1")).rejects.toMatchObject({ status: 409, code: "ALREADY_REGISTERED" });
    expect((await readEvent("e1")).registeredCount).toBe(1);
  });

  it("rejects registration when the event is full", async () => {
    await insertEvent("e1", { capacity: 1 });
    await registerForEvent(student(1), "e1");
    await expect(registerForEvent(student(2), "e1")).rejects.toMatchObject({ status: 409, code: "EVENT_FULL" });
  });

  it("returns clear errors for cancelled, unpublished, completed and started events", async () => {
    await insertEvent("cancelled", { status: "cancelled" });
    await insertEvent("draft", { status: "draft" });
    await insertEvent("completed", { status: "completed" });
    await insertEvent("started", { startDate: Timestamp.fromDate(inDays(-0.01)) });
    await expect(registerForEvent(student(), "cancelled")).rejects.toMatchObject({ code: "EVENT_CANCELLED" });
    await expect(registerForEvent(student(), "draft")).rejects.toMatchObject({ code: "EVENT_NOT_PUBLISHED" });
    await expect(registerForEvent(student(), "completed")).rejects.toMatchObject({ code: "EVENT_CLOSED" });
    await expect(registerForEvent(student(), "started")).rejects.toMatchObject({ code: "REGISTRATION_CLOSED" });
    await expect(registerForEvent(student(), "missing")).rejects.toMatchObject({ status: 404, code: "EVENT_NOT_FOUND" });
  });

  it("enforces capacity atomically under concurrent registrations", async () => {
    const capacity = 3;
    const contenders = 10;
    await insertEvent("hot", { capacity });

    const results = await Promise.allSettled(
      Array.from({ length: contenders }, (_, i) => registerForEvent(student(100 + i), "hot")),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

    expect(succeeded).toHaveLength(capacity);
    expect(rejected).toHaveLength(contenders - capacity);
    expect(rejected.every((r) => r.reason.code === "EVENT_FULL")).toBe(true);
    expect((await readEvent("hot")).registeredCount).toBe(capacity);
    const confirmed = await adminDb().collection("registrations").where("eventId", "==", "hot").get();
    expect(confirmed.size).toBe(capacity);
  });
});

describe("cancelRegistration", () => {
  it("cancels, frees the seat and allows registering again", async () => {
    await insertEvent("e1", { capacity: 1 });
    await registerForEvent(student(1), "e1");

    const cancelled = await cancelRegistration(student(1), "e1");
    expect(cancelled.status).toBe("cancelled");
    expect((await readEvent("e1")).registeredCount).toBe(0);

    // The freed seat can be taken by someone else, and the first student cannot double-cancel.
    await registerForEvent(student(2), "e1");
    await expect(cancelRegistration(student(1), "e1")).rejects.toMatchObject({ code: "NOT_REGISTERED" });
    await expect(registerForEvent(student(1), "e1")).rejects.toMatchObject({ code: "EVENT_FULL" });
  });

  it("lets a student re-register after cancelling", async () => {
    await insertEvent("e1");
    await registerForEvent(student(1), "e1");
    await cancelRegistration(student(1), "e1");
    await expect(registerForEvent(student(1), "e1")).resolves.toMatchObject({ status: "confirmed" });
    expect((await readEvent("e1")).registeredCount).toBe(1);
  });

  it("rejects cancelling without a registration or after the event is completed", async () => {
    await insertEvent("e1");
    await expect(cancelRegistration(student(1), "e1")).rejects.toMatchObject({ status: 404, code: "NOT_REGISTERED" });
    await registerForEvent(student(1), "e1");
    await adminDb().collection("events").doc("e1").update({ status: "completed" });
    await expect(cancelRegistration(student(1), "e1")).rejects.toMatchObject({ code: "EVENT_CLOSED" });
  });
});

describe("registration listings", () => {
  it("lists a student's own registrations with event details", async () => {
    await insertEvent("e1", { title: "First" });
    await insertEvent("e2", { title: "Second" });
    await registerForEvent(student(1), "e1");
    await registerForEvent(student(2), "e2");
    const mine = await listMyRegistrations(student(1));
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ eventId: "e1", event: { title: "First" } });
  });

  it("shows participants only to organizers of the event's organization", async () => {
    await insertEvent("e1");
    await registerForEvent(student(1), "e1");
    await expect(listEventRegistrations(organizer, "e1")).resolves.toMatchObject([
      { userId: "student-1", userEmail: "student1@ubbevents.test", status: "confirmed" },
    ]);
    await expect(listEventRegistrations(otherOrganizer, "e1")).rejects.toMatchObject({ status: 403 });
    await expect(listEventRegistrations(student(1), "e1")).rejects.toMatchObject({ status: 403 });
  });
});
