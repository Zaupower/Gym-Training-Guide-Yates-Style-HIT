import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma BEFORE importing the module under test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: { findMany: vi.fn() },
  },
}));

import { computeWarnings } from "@/lib/warnings";
import { prisma } from "@/lib/prisma";

type SessionRow = {
  date: Date;
  isDraft: boolean;
  overallFeel: "strong" | "flat" | "distracted" | null;
  exercises: { muscleGroup: string }[];
};

const findManyMock = prisma.session.findMany as unknown as ReturnType<typeof vi.fn>;

function setSessions(rows: SessionRow[]) {
  findManyMock.mockResolvedValue(rows);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

beforeEach(() => {
  findManyMock.mockReset();
});

describe("computeWarnings — overtraining", () => {
  it("fires when last 3 sessions are all flat or distracted", async () => {
    setSessions([
      { date: daysAgo(0), isDraft: false, overallFeel: "flat", exercises: [] },
      { date: daysAgo(2), isDraft: false, overallFeel: "distracted", exercises: [] },
      { date: daysAgo(4), isDraft: false, overallFeel: "flat", exercises: [] },
    ]);
    const w = await computeWarnings();
    expect(w.some((x) => x.kind === "overtraining")).toBe(true);
  });

  it("does not fire if any of the last 3 is strong", async () => {
    setSessions([
      { date: daysAgo(0), isDraft: false, overallFeel: "flat", exercises: [] },
      { date: daysAgo(2), isDraft: false, overallFeel: "strong", exercises: [] },
      { date: daysAgo(4), isDraft: false, overallFeel: "flat", exercises: [] },
    ]);
    const w = await computeWarnings();
    expect(w.some((x) => x.kind === "overtraining")).toBe(false);
  });

  it("does not fire with fewer than 3 sessions", async () => {
    setSessions([
      { date: daysAgo(0), isDraft: false, overallFeel: "flat", exercises: [] },
      { date: daysAgo(2), isDraft: false, overallFeel: "flat", exercises: [] },
    ]);
    const w = await computeWarnings();
    expect(w.some((x) => x.kind === "overtraining")).toBe(false);
  });
});

describe("computeWarnings — double-muscle within 7 days", () => {
  it("fires when chest is hit twice within 7 days", async () => {
    setSessions([
      {
        date: daysAgo(0),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "chest" }],
      },
      {
        date: daysAgo(3),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "chest" }],
      },
    ]);
    const w = await computeWarnings();
    expect(w.some((x) => x.kind === "double_muscle")).toBe(true);
  });

  it("does NOT fire for calves (Yates' exception)", async () => {
    setSessions([
      {
        date: daysAgo(0),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "calves" }],
      },
      {
        date: daysAgo(2),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "calves" }],
      },
    ]);
    const w = await computeWarnings();
    expect(w.some((x) => x.kind === "double_muscle")).toBe(false);
  });

  it("does not fire when sessions are >7 days apart", async () => {
    setSessions([
      {
        date: daysAgo(0),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "back" }],
      },
      {
        date: daysAgo(10),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "back" }],
      },
    ]);
    const w = await computeWarnings();
    expect(w.some((x) => x.kind === "double_muscle")).toBe(false);
  });

  it("counts a muscle group only once per session even if multiple exercises hit it", async () => {
    setSessions([
      {
        date: daysAgo(0),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "chest" }, { muscleGroup: "chest" }],
      },
    ]);
    const w = await computeWarnings();
    expect(w.some((x) => x.kind === "double_muscle")).toBe(false);
  });
});

describe("computeWarnings — deload reminder", () => {
  it("fires after 6 consecutive weeks of training", async () => {
    const rows: SessionRow[] = [];
    for (let week = 0; week < 6; week++) {
      rows.push({
        date: daysAgo(week * 7),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "chest" }],
      });
    }
    setSessions(rows);
    const w = await computeWarnings({ deloadAfterWeeks: 6 });
    expect(w.some((x) => x.kind === "deload")).toBe(true);
  });

  it("does not fire after only 3 weeks", async () => {
    const rows: SessionRow[] = [];
    for (let week = 0; week < 3; week++) {
      rows.push({
        date: daysAgo(week * 7),
        isDraft: false,
        overallFeel: "strong",
        exercises: [{ muscleGroup: "chest" }],
      });
    }
    setSessions(rows);
    const w = await computeWarnings({ deloadAfterWeeks: 6 });
    expect(w.some((x) => x.kind === "deload")).toBe(false);
  });
});

describe("computeWarnings — empty data", () => {
  it("returns no warnings when there are no sessions", async () => {
    setSessions([]);
    const w = await computeWarnings();
    expect(w).toEqual([]);
  });
});
