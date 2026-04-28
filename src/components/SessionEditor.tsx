"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronLeft,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  MUSCLE_GROUPS,
  OVERALL_FEELS,
  type ExerciseInput,
  type MuscleGroup,
  type OverallFeel,
  type SessionInput,
  type SetInput,
  type Unit,
} from "@/lib/types";

interface Props {
  initial: SessionInput;
  existingId?: string;
  defaultUnit: Unit;
}

const newSet = (kind: SetInput["kind"], unit: Unit): SetInput => ({
  kind,
  weight: 0,
  unit,
  reps: 0,
  toFailure: kind === "working",
});

const newExercise = (unit: Unit): ExerciseInput => ({
  name: "",
  muscleGroup: "chest",
  preExhaustWith: null,
  notes: "",
  sets: [newSet("working", unit)],
});

export default function SessionEditor({ initial, existingId, defaultUnit }: Props) {
  const router = useRouter();
  const [data, setData] = useState<SessionInput>(initial);
  const [library, setLibrary] = useState<{ name: string; muscleGroup: MuscleGroup }[]>(
    []
  );
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/exercise-library")
      .then((r) => r.json())
      .then(setLibrary)
      .catch(() => {});
  }, []);

  // Auto-save as draft on change (debounced)
  useEffect(() => {
    if (!data.exercises || data.exercises.length === 0) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      void save({ asDraft: true, silent: true });
    }, 1500);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save(opts: { asDraft: boolean; silent?: boolean }) {
    if (!opts.silent) setSavingState("saving");
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isDraft: opts.asDraft }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (!opts.silent) {
        setSavingState("saved");
        if (!opts.asDraft) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSavingState("idle");
    }
  }

  function patch(p: Partial<SessionInput>) {
    setData((d) => ({ ...d, ...p }));
  }

  function updateExercise(i: number, p: Partial<ExerciseInput>) {
    setData((d) => {
      const ex = [...d.exercises];
      ex[i] = { ...ex[i], ...p };
      return { ...d, exercises: ex };
    });
  }

  function addExercise() {
    setData((d) => ({ ...d, exercises: [...d.exercises, newExercise(defaultUnit)] }));
  }

  function removeExercise(i: number) {
    setData((d) => ({ ...d, exercises: d.exercises.filter((_, idx) => idx !== i) }));
  }

  function addSet(i: number, kind: SetInput["kind"]) {
    setData((d) => {
      const ex = [...d.exercises];
      ex[i] = { ...ex[i], sets: [...ex[i].sets, newSet(kind, defaultUnit)] };
      return { ...d, exercises: ex };
    });
  }

  function updateSet(exIdx: number, setIdx: number, p: Partial<SetInput>) {
    setData((d) => {
      const ex = [...d.exercises];
      const sets = [...ex[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...p };
      ex[exIdx] = { ...ex[exIdx], sets };
      return { ...d, exercises: ex };
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setData((d) => {
      const ex = [...d.exercises];
      ex[exIdx] = { ...ex[exIdx], sets: ex[exIdx].sets.filter((_, j) => j !== setIdx) };
      return { ...d, exercises: ex };
    });
  }

  const dietTagsStr = useMemo(() => (data.dietTags ?? []).join(", "), [data.dietTags]);

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-ink/70 hover:bg-black/5"
        >
          <ChevronLeft size={18} /> Back
        </Link>
        <div className="flex items-center gap-2 text-xs text-ink/50">
          {savingState === "saving" && <Loader2 size={14} className="animate-spin" />}
          {savingState === "saved" && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Date + pre-session */}
      <section className="mb-4 rounded-2xl border border-black/10 bg-white p-4">
        <label className="block text-xs uppercase tracking-wide text-ink/50">
          Date
        </label>
        <input
          type="date"
          className="w-full bg-transparent text-lg font-semibold focus:outline-none"
          value={data.date}
          onChange={(e) => patch({ date: e.target.value })}
        />

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Slider
            label="Energy"
            value={data.energy ?? 0}
            onChange={(v) => patch({ energy: v })}
          />
          <Slider
            label="Sleep"
            value={data.sleep ?? 0}
            onChange={(v) => patch({ sleep: v })}
          />
          <Slider
            label="Stress"
            value={data.stress ?? 0}
            onChange={(v) => patch({ stress: v })}
          />
        </div>
      </section>

      {/* Exercises */}
      <section className="space-y-3">
        {data.exercises.map((ex, i) => (
          <div
            key={i}
            className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <input
                list="exercise-library"
                placeholder="Exercise name"
                className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-base focus:border-ink focus:outline-none"
                value={ex.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const match = library.find(
                    (l) => l.name.toLowerCase() === name.toLowerCase()
                  );
                  updateExercise(i, {
                    name,
                    ...(match ? { muscleGroup: match.muscleGroup } : {}),
                  });
                }}
              />
              <button
                aria-label="Remove exercise"
                onClick={() => removeExercise(i)}
                className="rounded-lg p-2 text-ink/40 hover:bg-black/5 hover:text-accent"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <select
              className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              value={ex.muscleGroup}
              onChange={(e) =>
                updateExercise(i, { muscleGroup: e.target.value as MuscleGroup })
              }
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <div className="mt-3 space-y-1.5">
              {ex.sets.map((s, j) => (
                <SetRow
                  key={j}
                  set={s}
                  onChange={(p) => updateSet(i, j, p)}
                  onRemove={() => removeSet(i, j)}
                />
              ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => addSet(i, "warmup")}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-ink/70 hover:bg-black/5"
              >
                + Warm-up
              </button>
              <button
                onClick={() => addSet(i, "working")}
                className="rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
              >
                + Working set
              </button>
              <button
                onClick={() => addSet(i, "drop")}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-ink/70 hover:bg-black/5"
              >
                + Drop set
              </button>
            </div>

            <textarea
              placeholder="Exercise notes…"
              className="mt-3 w-full resize-none rounded-lg border border-black/10 bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
              rows={2}
              value={ex.notes ?? ""}
              onChange={(e) => updateExercise(i, { notes: e.target.value })}
            />
          </div>
        ))}

        <button
          onClick={addExercise}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 py-4 text-sm font-medium text-ink/60 hover:border-ink/40 hover:text-ink"
        >
          <Plus size={18} /> Add exercise
        </button>
      </section>

      {/* Post-session */}
      <section className="mt-4 space-y-3 rounded-2xl border border-black/10 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
            Overall feel
          </label>
          <div className="flex gap-1.5">
            {OVERALL_FEELS.map((f) => (
              <button
                key={f}
                onClick={() => patch({ overallFeel: f as OverallFeel })}
                className={`flex-1 rounded-lg border px-2 py-2 text-sm capitalize ${
                  data.overallFeel === f
                    ? "border-ink bg-ink text-white"
                    : "border-black/10 bg-white text-ink/70"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
            Diet notes
          </label>
          <textarea
            className="w-full resize-none rounded-lg border border-black/10 bg-paper px-3 py-2 text-sm"
            rows={2}
            value={data.dietNotes ?? ""}
            onChange={(e) => patch({ dietNotes: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
            Diet tags (comma-separated)
          </label>
          <input
            className="w-full rounded-lg border border-black/10 bg-paper px-3 py-2 text-sm"
            value={dietTagsStr}
            onChange={(e) =>
              patch({
                dietTags: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
            Session notes
          </label>
          <textarea
            className="w-full resize-none rounded-lg border border-black/10 bg-paper px-3 py-2 text-sm"
            rows={3}
            value={data.notes ?? ""}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </div>
      </section>

      {error && (
        <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="sticky bottom-20 mt-4 flex gap-2">
        <button
          onClick={() => save({ asDraft: true })}
          className="flex-1 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-medium text-ink/80 shadow-sm"
        >
          Save draft
        </button>
        <button
          onClick={() => save({ asDraft: false })}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          <Save size={16} /> Save session
        </button>
      </div>

      <datalist id="exercise-library">
        {library.map((l) => (
          <option key={l.name} value={l.name} />
        ))}
      </datalist>

      {existingId && (
        <button
          onClick={async () => {
            if (!confirm("Delete this session?")) return;
            await fetch(`/api/sessions/${existingId}`, { method: "DELETE" });
            router.push("/");
            router.refresh();
          }}
          className="mt-6 w-full rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Delete session
        </button>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-ink/50">{label}</span>
        <span className="text-sm font-semibold">{value || "—"}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(value === n ? 0 : n)}
            className={`h-8 flex-1 rounded-md text-xs ${
              value >= n
                ? "bg-ink text-white"
                : "border border-black/10 bg-white text-ink/40"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SetRow({
  set,
  onChange,
  onRemove,
}: {
  set: SetInput;
  onChange: (p: Partial<SetInput>) => void;
  onRemove: () => void;
}) {
  const kindStyle =
    set.kind === "working"
      ? "border-accent/40 bg-accent/5"
      : set.kind === "drop"
      ? "border-purple-300 bg-purple-50"
      : "border-black/10 bg-paper";
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${kindStyle}`}>
      <span className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ink/60">
        {set.kind === "working" ? "Work" : set.kind === "drop" ? "Drop" : "Warm"}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        placeholder="kg"
        className="w-16 rounded border border-black/10 bg-white px-2 py-1 text-center text-sm"
        value={set.weight || ""}
        onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
      />
      <span className="text-xs text-ink/50">×</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        className="w-14 rounded border border-black/10 bg-white px-2 py-1 text-center text-sm"
        value={set.reps || ""}
        onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
      />
      <select
        className="rounded border border-black/10 bg-white px-1 py-1 text-xs"
        value={set.unit}
        onChange={(e) => onChange({ unit: e.target.value as Unit })}
      >
        <option value="kg">kg</option>
        <option value="lb">lb</option>
      </select>
      {set.kind === "working" && (
        <label className="flex items-center gap-1 text-[11px] text-ink/70">
          <input
            type="checkbox"
            checked={set.toFailure}
            onChange={(e) => onChange({ toFailure: e.target.checked })}
          />
          fail
        </label>
      )}
      <button
        onClick={onRemove}
        aria-label="Remove set"
        className="ml-auto rounded p-1 text-ink/30 hover:bg-black/5 hover:text-accent"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
