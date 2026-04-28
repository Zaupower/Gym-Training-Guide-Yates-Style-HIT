import { describe, expect, it } from "vitest";
import { toDateOnly, todayIso, MUSCLE_GROUPS, OVERALL_FEELS } from "@/lib/types";

describe("toDateOnly", () => {
  it("formats a Date as YYYY-MM-DD using UTC", () => {
    expect(toDateOnly(new Date("2026-04-28T12:34:56Z"))).toBe("2026-04-28");
  });

  it("accepts an ISO string", () => {
    expect(toDateOnly("2026-01-05T00:00:00Z")).toBe("2026-01-05");
  });

  it("zero-pads month and day", () => {
    expect(toDateOnly(new Date("2026-03-09T00:00:00Z"))).toBe("2026-03-09");
  });
});

describe("todayIso", () => {
  it("matches YYYY-MM-DD shape", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("constants", () => {
  it("has the 9 muscle groups from the spec", () => {
    expect(MUSCLE_GROUPS).toEqual([
      "chest",
      "back",
      "legs",
      "shoulders",
      "biceps",
      "triceps",
      "calves",
      "abs",
      "other",
    ]);
  });

  it("has the 3 overall-feel values from the spec", () => {
    expect(OVERALL_FEELS).toEqual(["strong", "flat", "distracted"]);
  });
});
