import { describe, expect, it } from "vitest";
import { canTransitionEventStatus, validateEventDraft, type EventDraft } from "./event-lifecycle";

const now = new Date("2027-01-01T00:00:00.000Z");
const validDraft: EventDraft = {
  title: "Introductory workshop",
  description: "A practical workshop for students.",
  startDate: "2027-03-10T10:00:00.000Z",
  endDate: "2027-03-10T12:00:00.000Z",
  location: "Main building",
  organizationId: "student-association",
  capacity: 40,
};

describe("validateEventDraft", () => {
  it("accepts a complete event with valid dates and capacity", () => {
    expect(validateEventDraft(validDraft, now)).toEqual([]);
  });
  it("rejects fractional or non-positive capacity", () => {
    expect(validateEventDraft({ ...validDraft, capacity: 0.5 }, now)).toContain(
      "Capacity must be a positive whole number.",
    );
  });
  it("rejects a start date that is not in the future", () => {
    expect(validateEventDraft({ ...validDraft, startDate: "2026-12-31T23:59:00Z" }, now)).toContain(
      "The event must start in the future.",
    );
  });
  it("rejects an end date that is not after the start date", () => {
    expect(validateEventDraft({ ...validDraft, endDate: validDraft.startDate }, now)).toContain(
      "The end date must be after the start date.",
    );
  });
});

describe("canTransitionEventStatus", () => {
  it("allows a draft event to be published", () => {
    expect(canTransitionEventStatus("draft", "published")).toBe(true);
  });
  it("allows a published event to be completed or cancelled", () => {
    expect(canTransitionEventStatus("published", "completed")).toBe(true);
    expect(canTransitionEventStatus("published", "cancelled")).toBe(true);
  });
  it("keeps completed and cancelled events terminal", () => {
    expect(canTransitionEventStatus("completed", "published")).toBe(false);
    expect(canTransitionEventStatus("cancelled", "completed")).toBe(false);
  });
});