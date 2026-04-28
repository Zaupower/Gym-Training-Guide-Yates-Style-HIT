"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface Props {
  year: number;
  month: number; // 0-indexed
  sessionsByDate: Record<
    string,
    { id: string; isDraft: boolean; exerciseCount: number }
  >;
  experimentDates: string[];
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function Calendar({
  year,
  month,
  sessionsByDate,
  experimentDates,
}: Props) {
  const router = useRouter();
  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);
  const expSet = useMemo(() => new Set(experimentDates), [experimentDates]);

  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // Monday-first offset
  const startOffset = (first.getUTCDay() + 6) % 7;

  const cells: { key: string; day: number | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ key: `pad-${i}`, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    cells.push({ key, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ key: `pad-end-${cells.length}`, day: null });

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  function nav(delta: number) {
    const next = new Date(Date.UTC(year, month + delta, 1));
    router.push(
      `/?m=${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between px-1">
        <button
          aria-label="Previous month"
          onClick={() => nav(-1)}
          className="rounded-full p-2 hover:bg-black/5"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-base font-semibold">{monthLabel}</div>
        <button
          aria-label="Next month"
          onClick={() => nav(1)}
          className="rounded-full p-2 hover:bg-black/5"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1 text-center text-xs text-ink/50">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 px-1">
        {cells.map((c) => {
          if (c.day === null) return <div key={c.key} className="aspect-square" />;
          const session = sessionsByDate[c.key];
          const isToday = c.key === todayKey;
          const hasExp = expSet.has(c.key);
          const href = session
            ? `/session/${session.id}`
            : `/session/new?date=${c.key}`;
          return (
            <Link
              key={c.key}
              href={href}
              className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition active:scale-95 ${
                session
                  ? session.isDraft
                    ? "border-amber-300 bg-amber-50"
                    : "border-accent/30 bg-accent/5"
                  : "border-black/10 bg-white hover:bg-black/[0.03]"
              } ${isToday ? "ring-2 ring-ink" : ""}`}
            >
              <span
                className={`text-base ${
                  session ? "font-semibold text-ink" : "text-ink/70"
                }`}
              >
                {c.day}
              </span>
              <div className="absolute bottom-1.5 flex items-center gap-1">
                {session && !session.isDraft && (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                )}
                {session?.isDraft && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
                {hasExp && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 px-1 text-[11px] text-ink/50">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> session
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> draft
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> experiment
        </span>
      </div>
    </div>
  );
}
