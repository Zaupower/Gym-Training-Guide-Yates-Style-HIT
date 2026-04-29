export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "biceps",
  "triceps",
  "calves",
  "abs",
  "cardio",
  "other",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const OVERALL_FEELS = ["strong", "flat", "distracted"] as const;
export type OverallFeel = (typeof OVERALL_FEELS)[number];

export type Unit = "kg" | "lb";
export type SetKind = "warmup" | "working" | "drop";
export type DurationUnit = "min" | "sec";

export interface SetInput {
  kind: SetKind;
  weight: number;
  unit: Unit;
  reps: number;
  toFailure: boolean;
  durationUnit?: DurationUnit | null;
}

export interface ExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  preExhaustWith?: string | null;
  notes?: string;
  sets: SetInput[];
}

export interface SessionInput {
  date: string; // YYYY-MM-DD
  title?: string;
  energy?: number | null;
  sleep?: number | null;
  stress?: number | null;
  overallFeel?: OverallFeel | null;
  dietNotes?: string;
  dietTags?: string[];
  notes?: string;
  isDraft?: boolean;
  exercises: ExerciseInput[];
}

export function toDateOnly(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toDateOnly(new Date());
}
