import { prisma } from "./prisma";
import type { MuscleGroup } from "./types";

export interface Warning {
  kind: "deload" | "overtraining" | "double_muscle";
  message: string;
}

/**
 * Compute warnings against current data set.
 * - Deload: 6+ consecutive ISO weeks containing >=2 sessions and no "easy" markers (we use any logged session as "hard" for v1).
 * - Overtraining: last 3 (non-draft) sessions have overallFeel "flat" or "distracted".
 * - Double muscle: any non-calves muscle group appears in two sessions within the last rolling 7 days.
 */
export async function computeWarnings(opts?: {
  deloadAfterWeeks?: number;
  userId?: string;
}): Promise<Warning[]> {
  const deloadAfterWeeks = opts?.deloadAfterWeeks ?? 6;
  const warnings: Warning[] = [];

  const recent = await prisma.session.findMany({
    where: {
      isDraft: false,
      ...(opts?.userId ? { userId: opts.userId } : {}),
    },
    orderBy: { date: "desc" },
    take: 60,
    include: { exercises: true },
  });

  // Overtraining
  const last3 = recent.slice(0, 3);
  if (
    last3.length === 3 &&
    last3.every((s) => s.overallFeel === "flat" || s.overallFeel === "distracted")
  ) {
    warnings.push({
      kind: "overtraining",
      message:
        "3 consecutive sessions logged as flat or distracted. Consider an easy week.",
    });
  }

  // Double muscle within 7 days
  const sevenAgo = new Date();
  sevenAgo.setDate(sevenAgo.getDate() - 7);
  const last7 = recent.filter((s) => s.date >= sevenAgo);
  const seen = new Map<MuscleGroup, number>();
  for (const s of last7) {
    const groups = new Set(s.exercises.map((e) => e.muscleGroup as MuscleGroup));
    for (const g of groups) {
      if (g === "calves") continue;
      seen.set(g, (seen.get(g) ?? 0) + 1);
    }
  }
  for (const [g, count] of seen) {
    if (count >= 2) {
      warnings.push({
        kind: "double_muscle",
        message: `${g} trained ${count}× in the last 7 days. Yates rule: once per week per muscle.`,
      });
    }
  }

  // Deload — count distinct ISO weeks with >=1 session, going back consecutively from current week
  if (recent.length > 0) {
    const weeks = new Set<string>();
    for (const s of recent) weeks.add(isoWeekKey(s.date));
    let consecutive = 0;
    const cursor = new Date();
    for (let i = 0; i < 26; i++) {
      const key = isoWeekKey(cursor);
      if (weeks.has(key)) consecutive++;
      else if (consecutive > 0) break;
      cursor.setDate(cursor.getDate() - 7);
    }
    if (consecutive >= deloadAfterWeeks) {
      warnings.push({
        kind: "deload",
        message: `You've trained ${consecutive} weeks straight. Consider 2 weeks submaximal.`,
      });
    }
  }

  return warnings;
}

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
