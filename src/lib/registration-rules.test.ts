import { describe, expect, it } from "vitest";
import { canManageOrganization, canViewEvent, registrationBlockReason } from "./registration-rules";

const now = new Date("2027-01-01T00:00:00.000Z");
const openEvent = {
  status: "published" as const,
  startDate: new Date("2027-02-01T10:00:00.000Z"),
  capacity: 2,
  registeredCount: 1,
};

describe("registrationBlockReason", () => {
  it("allows registration for a published, future event with free seats", () => {
    expect(registrationBlockReason(openEvent, now)).toBeNull();
  });
  it("rejects a full event", () => {
    expect(registrationBlockReason({ ...openEvent, registeredCount: 2 }, now)).toBe("EVENT_FULL");
  });
  it("rejects cancelled, draft and completed events with distinct reasons", () => {
    expect(registrationBlockReason({ ...openEvent, status: "cancelled" }, now)).toBe("EVENT_CANCELLED");
    expect(registrationBlockReason({ ...openEvent, status: "draft" }, now)).toBe("EVENT_NOT_PUBLISHED");
    expect(registrationBlockReason({ ...openEvent, status: "completed" }, now)).toBe("EVENT_CLOSED");
  });
  it("reports cancellation before capacity", () => {
    expect(registrationBlockReason({ ...openEvent, status: "cancelled", registeredCount: 2 }, now)).toBe("EVENT_CANCELLED");
  });
  it("closes registration once the event has started", () => {
    expect(registrationBlockReason({ ...openEvent, startDate: now }, now)).toBe("REGISTRATION_CLOSED");
  });
});

describe("canManageOrganization", () => {
  it("allows organizers of the same organization and platform admins", () => {
    expect(canManageOrganization({ role: "organizer", organizationId: "org-a" }, "org-a")).toBe(true);
    expect(canManageOrganization({ role: "admin", organizationId: null }, "org-a")).toBe(true);
  });
  it("rejects organizers of another organization, students and anonymous users", () => {
    expect(canManageOrganization({ role: "organizer", organizationId: "org-b" }, "org-a")).toBe(false);
    expect(canManageOrganization({ role: "student", organizationId: "org-a" }, "org-a")).toBe(false);
    expect(canManageOrganization(null, "org-a")).toBe(false);
  });
});

describe("canViewEvent", () => {
  it("hides drafts from everyone except the organization's organizers", () => {
    const draft = { status: "draft" as const, organizationId: "org-a" };
    expect(canViewEvent(null, draft)).toBe(false);
    expect(canViewEvent({ role: "student", organizationId: null }, draft)).toBe(false);
    expect(canViewEvent({ role: "organizer", organizationId: "org-a" }, draft)).toBe(true);
  });
  it("shows non-draft events to anyone", () => {
    expect(canViewEvent(null, { status: "published", organizationId: "org-a" })).toBe(true);
    expect(canViewEvent(null, { status: "cancelled", organizationId: "org-a" })).toBe(true);
  });
});
