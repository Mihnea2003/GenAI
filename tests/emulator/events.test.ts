import { beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { createEvent, getEvent, listManagedEvents, listPublishedEvents, updateEvent } from "@/server/events-service";
import { admin, inDays, insertEvent, organizer, otherOrganizer, readEvent, resetEmulators, seedBaseData, student } from "./helpers";

const validInput = () => ({
  organizationId: "org-a",
  title: "Intro to Firebase",
  description: "Hands-on workshop",
  location: "Room 2/I",
  startDate: inDays(10).toISOString(),
  endDate: new Date(inDays(10).getTime() + 7_200_000).toISOString(),
  capacity: 30,
});

beforeEach(async () => {
  await resetEmulators();
  await seedBaseData();
});

describe("createEvent", () => {
  it("persists a draft for an organizer of the organization", async () => {
    const event = await createEvent(organizer, validInput());
    expect(event).toMatchObject({ status: "draft", organizationName: "Org A", registeredCount: 0, createdBy: organizer.id });
    expect((await readEvent(event.id)).title).toBe("Intro to Firebase");
  });

  it("can create the event directly as published", async () => {
    const event = await createEvent(organizer, { ...validInput(), status: "published" });
    expect(event.status).toBe("published");
  });

  it("rejects students and organizers of other organizations", async () => {
    await expect(createEvent(student(), validInput())).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    await expect(createEvent(otherOrganizer, validInput())).rejects.toMatchObject({ status: 403 });
  });

  it("lets an admin create events for any organization", async () => {
    await expect(createEvent(admin, { ...validInput(), organizationId: "org-b" })).resolves.toMatchObject({ organizationId: "org-b" });
  });

  it("rejects invalid data with a field-specific validation error", async () => {
    await expect(createEvent(organizer, { ...validInput(), capacity: 0 })).rejects.toMatchObject({
      status: 400, code: "VALIDATION_ERROR", field: "capacity",
    });
    await expect(createEvent(organizer, { ...validInput(), startDate: inDays(-1).toISOString() })).rejects.toMatchObject({
      field: "startDate",
    });
    await expect(createEvent(organizer, { ...validInput(), startDate: "2030-01-01T10:00" })).rejects.toMatchObject({
      field: "startDate",
    });
  });

  it("refuses to create an event as completed", async () => {
    await expect(createEvent(organizer, { ...validInput(), status: "completed" })).rejects.toMatchObject({ field: "status" });
  });
});

describe("updateEvent", () => {
  it("lets the organizer update details and persists them", async () => {
    await insertEvent("e1");
    const updated = await updateEvent(organizer, "e1", { title: "Renamed", capacity: 50 });
    expect(updated).toMatchObject({ title: "Renamed", capacity: 50 });
    expect(await readEvent("e1")).toMatchObject({ title: "Renamed", capacity: 50 });
  });

  it("enforces allowed status transitions", async () => {
    await insertEvent("draft", { status: "draft" });
    await expect(updateEvent(organizer, "draft", { status: "completed" })).rejects.toMatchObject({
      status: 400, code: "INVALID_STATUS_TRANSITION",
    });
    await expect(updateEvent(organizer, "draft", { status: "published" })).resolves.toMatchObject({ status: "published" });
    await expect(updateEvent(organizer, "draft", { status: "completed" })).resolves.toMatchObject({ status: "completed" });
  });

  it("locks completed and cancelled events", async () => {
    await insertEvent("cancelled", { status: "cancelled" });
    await expect(updateEvent(organizer, "cancelled", { title: "Back again" })).rejects.toMatchObject({ code: "EVENT_LOCKED" });
    await expect(updateEvent(organizer, "cancelled", { status: "published" })).rejects.toMatchObject({ code: "EVENT_LOCKED" });
  });

  it("forbids organizers of another organization and students", async () => {
    await insertEvent("e1");
    await expect(updateEvent(otherOrganizer, "e1", { title: "Hijack" })).rejects.toMatchObject({ status: 403 });
    await expect(updateEvent(student(), "e1", { title: "Hijack" })).rejects.toMatchObject({ status: 403 });
    expect((await readEvent("e1")).title).toBe("Seeded event");
  });

  it("does not reveal another organization's drafts", async () => {
    await insertEvent("secret", { status: "draft" });
    await expect(updateEvent(otherOrganizer, "secret", { title: "x" })).rejects.toMatchObject({ status: 404 });
  });

  it("does not lower capacity below confirmed registrations", async () => {
    await insertEvent("e1", { capacity: 10, registeredCount: 6 });
    await expect(updateEvent(organizer, "e1", { capacity: 5 })).rejects.toMatchObject({ field: "capacity" });
    await expect(updateEvent(organizer, "e1", { capacity: 6 })).resolves.toMatchObject({ capacity: 6, remainingCapacity: 0 });
  });

  it("rejects moving an event to another organization or unknown fields", async () => {
    await insertEvent("e1");
    await expect(updateEvent(organizer, "e1", { organizationId: "org-b" })).rejects.toMatchObject({ field: "organizationId" });
    await expect(updateEvent(organizer, "e1", { registeredCount: 0 })).rejects.toMatchObject({ field: "registeredCount" });
  });

  it("returns 404 for a missing event", async () => {
    await expect(updateEvent(organizer, "missing", { title: "x" })).rejects.toMatchObject({ code: "EVENT_NOT_FOUND" });
  });
});

describe("event queries", () => {
  beforeEach(async () => {
    await insertEvent("pub-a", { title: "Git workshop", location: "FMI" });
    await insertEvent("pub-b", { title: "Debate night", organizationId: "org-b", organizationName: "Org B" });
    await insertEvent("draft-a", { status: "draft" });
    await insertEvent("cancelled-a", { status: "cancelled" });
    await insertEvent("past-a", { startDate: Timestamp.fromDate(inDays(-3)), endDate: Timestamp.fromDate(inDays(-2)) });
  });

  it("lists only upcoming published events, filtered by text and organization", async () => {
    expect((await listPublishedEvents()).map((e) => e.id).sort()).toEqual(["pub-a", "pub-b"]);
    expect((await listPublishedEvents({ q: "git" })).map((e) => e.id)).toEqual(["pub-a"]);
    expect((await listPublishedEvents({ q: "org b" })).map((e) => e.id)).toEqual(["pub-b"]);
    expect((await listPublishedEvents({ organizationId: "org-a" })).map((e) => e.id)).toEqual(["pub-a"]);
    expect((await listPublishedEvents({ includePast: true })).map((e) => e.id)).toContain("past-a");
  });

  it("hides drafts from students but shows them to the organization's organizers", async () => {
    await expect(getEvent("draft-a", null)).rejects.toMatchObject({ status: 404 });
    await expect(getEvent("draft-a", student())).rejects.toMatchObject({ status: 404 });
    await expect(getEvent("draft-a", organizer)).resolves.toMatchObject({ status: "draft" });
    await expect(getEvent("cancelled-a", null)).resolves.toMatchObject({ status: "cancelled" });
  });

  it("lists every status of the organizer's own organization only", async () => {
    const ids = (await listManagedEvents(organizer)).map((e) => e.id).sort();
    expect(ids).toEqual(["cancelled-a", "draft-a", "past-a", "pub-a"]);
    await expect(listManagedEvents(organizer, "org-b")).rejects.toMatchObject({ status: 403 });
    await expect(listManagedEvents(student())).rejects.toMatchObject({ status: 403 });
  });
});
