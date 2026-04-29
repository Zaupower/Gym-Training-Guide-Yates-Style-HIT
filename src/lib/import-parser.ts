import type { MuscleGroup, SetKind } from "@/lib/types";

export interface ParsedSet {
  kind: SetKind;
  weight: number;
  unit: "kg" | "lb";
  reps: number;
  toFailure: boolean;
  durationUnit: "min" | "sec" | null;
}

export interface ParsedExercise {
  name: string;
  muscleGroup: MuscleGroup;
  sets: ParsedSet[];
}

export interface ParsedSession {
  date: Date;
  title: string;
  notes: string;
  exercises: ParsedExercise[];
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  sessions: ParsedSession[];
  errors: ParseError[];
}

const DAY_NAMES: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  chest: "chest", back: "back", legs: "legs", shoulders: "shoulders",
  biceps: "biceps", triceps: "triceps", calves: "calves", abs: "abs",
  cardio: "cardio", other: "other",
};

function nextOccurrence(from: Date, dayOfWeek: number): Date {
  const d = new Date(from);
  const diff = (dayOfWeek - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function parseSetGroup(text: string, lineNum: number, errors: ParseError[]): ParsedSet[] {
  let kind: SetKind = "working";
  let t = text.trim();

  if (t.startsWith("w:")) { kind = "warmup"; t = t.slice(2); }
  else if (t.startsWith("d:")) { kind = "drop"; t = t.slice(2); }

  // Cardio format: NxDURATION (e.g. 3x20min, 1x45sec)
  const cardio = t.match(/^(\d+)\s*x\s*(\d+)\s*(min|sec)/i);
  if (cardio) {
    const count = parseInt(cardio[1]);
    const duration = parseInt(cardio[2]);
    const durationUnit = cardio[3].toLowerCase() as "min" | "sec";
    return Array.from({ length: count }, () => ({
      kind, weight: 0, unit: "kg" as const, reps: duration, toFailure: false, durationUnit,
    }));
  }

  // Strength format: NxREPS@WEIGHT
  const m = t.match(/^(\d+)\s*x\s*(\d+)\s*@\s*([\d.]+)\s*(kg|lb)?/i);
  if (!m) {
    errors.push({ line: lineNum, message: `Cannot parse set: "${text.trim()}"` });
    return [];
  }

  const count = parseInt(m[1]);
  const reps = parseInt(m[2]);
  const weight = parseFloat(m[3]);
  const unit: "kg" | "lb" = (m[4]?.toLowerCase() as "kg" | "lb") ?? "kg";

  return Array.from({ length: count }, () => ({ kind, weight, unit, reps, toFailure: false, durationUnit: null }));
}

function parseExerciseLine(line: string, lineNum: number, errors: ParseError[]): ParsedExercise | null {
  const parts = line.split("|").map(p => p.trim());
  if (parts.length < 3) {
    errors.push({ line: lineNum, message: `Exercise needs 3 parts (Name | muscle | sets): "${line}"` });
    return null;
  }

  const name = parts[0];
  if (!name) { errors.push({ line: lineNum, message: "Exercise name is empty" }); return null; }

  const muscleGroup = MUSCLE_MAP[parts[1].toLowerCase()];
  if (!muscleGroup) {
    errors.push({ line: lineNum, message: `Unknown muscle group "${parts[1]}". Use: ${Object.keys(MUSCLE_MAP).join(", ")}` });
    return null;
  }

  const sets: ParsedSet[] = [];
  for (const group of parts[2].split(",")) {
    sets.push(...parseSetGroup(group, lineNum, errors));
  }

  if (sets.length === 0) return null;
  return { name, muscleGroup, sets };
}

function parseStartDate(value: string, lineNum: number, errors: ParseError[]): Date | null {
  const v = value.trim().toLowerCase();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (v === "today") return today;
  if (v === "next-monday") {
    const next = new Date(today);
    next.setUTCDate(next.getUTCDate() + 1);
    return nextOccurrence(next, 1);
  }

  const d = new Date(v);
  if (isNaN(d.getTime())) {
    errors.push({ line: lineNum, message: `Invalid date "${value}". Use YYYY-MM-DD, today, or next-monday` });
    return null;
  }
  return d;
}

export interface SplitPlan {
  name: string;
  content: string;
}

export function splitPlanContent(text: string): SplitPlan[] {
  const lines = text.split(/\r?\n/);

  const weeksIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].replace(/#.*$/, "").trim().toUpperCase().startsWith("WEEKS:")) {
      weeksIndices.push(i);
    }
  }

  if (weeksIndices.length <= 1) return [];

  const plans: SplitPlan[] = [];
  for (let p = 0; p < weeksIndices.length; p++) {
    const blockStart = weeksIndices[p];
    const blockEnd = p + 1 < weeksIndices.length ? weeksIndices[p + 1] : lines.length;

    let name = `Plan ${p + 1}`;
    for (let i = blockStart - 1; i >= 0; i--) {
      const raw = lines[i].trim();
      if (raw === "") continue;
      if (raw.startsWith("#")) {
        const extracted = raw.replace(/^#+/, "").replace(/=+/g, "").trim();
        if (extracted) name = extracted;
      }
      break;
    }

    const content = lines.slice(blockStart, blockEnd).join("\n").trim();
    plans.push({ name, content });
  }

  return plans;
}

export function parseImport(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const errors: ParseError[] = [];

  let weeks = 1;
  let startDate: Date | null = null;
  const dayBlocks = new Map<number, ParsedExercise[]>();
  const dayTitles = new Map<number, string>();
  const dayNotes = new Map<number, string>();
  let currentDay: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].replace(/#.*$/, "").trim();
    if (!line) continue;

    const upper = line.toUpperCase();

    if (upper.startsWith("WEEKS:")) {
      weeks = parseInt(line.slice(6).trim());
      if (isNaN(weeks) || weeks < 1) {
        errors.push({ line: lineNum, message: "WEEKS must be a positive number" });
        weeks = 1;
      }
      currentDay = null;
      continue;
    }

    if (upper.startsWith("START:")) {
      startDate = parseStartDate(line.slice(6), lineNum, errors);
      currentDay = null;
      continue;
    }

    if (upper.startsWith("DAY:")) {
      const dayName = line.slice(4).trim().toLowerCase();
      const dayNum = DAY_NAMES[dayName];
      if (dayNum === undefined) {
        errors.push({ line: lineNum, message: `Unknown day "${dayName}". Use: monday, tuesday, …` });
        currentDay = null;
      } else {
        currentDay = dayNum;
        if (!dayBlocks.has(currentDay)) dayBlocks.set(currentDay, []);
      }
      continue;
    }

    if (upper.startsWith("TITLE:") && currentDay !== null) {
      dayTitles.set(currentDay, line.slice(6).trim());
      continue;
    }

    if (upper.startsWith("NOTES:") && currentDay !== null) {
      const text = line.slice(6).trim();
      const existing = dayNotes.get(currentDay);
      dayNotes.set(currentDay, existing ? `${existing}\n${text}` : text);
      continue;
    }

    if (currentDay !== null) {
      const exercise = parseExerciseLine(line, lineNum, errors);
      if (exercise) dayBlocks.get(currentDay)!.push(exercise);
      continue;
    }

    errors.push({ line: lineNum, message: `Unexpected line: "${line}"` });
  }

  if (!startDate) {
    if (!errors.some(e => e.message.includes("START")))
      errors.push({ line: 0, message: "START date is required" });
    return { sessions: [], errors };
  }

  const sessions: ParsedSession[] = [];
  for (const [dayOfWeek, exercises] of dayBlocks) {
    if (exercises.length === 0) continue;
    const first = nextOccurrence(startDate, dayOfWeek);
    for (let w = 0; w < weeks; w++) {
      const date = new Date(first);
      date.setUTCDate(date.getUTCDate() + w * 7);
      sessions.push({
        date,
        title: dayTitles.get(dayOfWeek) ?? "",
        notes: dayNotes.get(dayOfWeek) ?? "",
        exercises,
      });
    }
  }

  sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { sessions, errors };
}
