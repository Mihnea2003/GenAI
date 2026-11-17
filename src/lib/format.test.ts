import { describe, expect, it } from "vitest";
import { capacityLabel } from "./format";

describe("capacityLabel", () => {
  it("describes open, almost full, full and cancelled events", () => {
    expect(capacityLabel({ status: "published", capacity: 40, remainingCapacity: 12 })).toBe("12 of 40 seats left");
    expect(capacityLabel({ status: "published", capacity: 40, remainingCapacity: 1 })).toBe("1 seat left");
    expect(capacityLabel({ status: "published", capacity: 40, remainingCapacity: 0 })).toBe("Full · 40 seats");
    expect(capacityLabel({ status: "cancelled", capacity: 40, remainingCapacity: 10 })).toBe("Cancelled");
  });
});
