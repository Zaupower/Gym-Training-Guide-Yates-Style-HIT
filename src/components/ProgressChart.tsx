"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  series: { date: string; weight: number; reps: number; volume: number }[];
  experiments: { date: string; label: string }[];
}

export default function ProgressChart({ series, experiments }: Props) {
  if (series.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-ink/50">
        No working-set data yet for this exercise.
      </p>
    );
  }
  // Plateau: working set hasn't progressed (max weight*reps) in last 4 entries
  const last4 = series.slice(-4);
  const plateau =
    last4.length === 4 && last4.every((p) => p.volume <= last4[0].volume);

  return (
    <div className="space-y-3">
      {plateau && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Plateau flag: working set hasn&apos;t progressed in last 4 entries.
        </div>
      )}
      <div className="rounded-2xl border border-black/10 bg-white p-3">
        <div className="text-xs uppercase tracking-wide text-ink/50">
          Working set
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#c1121f"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="reps"
                stroke="#0f1115"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={{ r: 2 }}
              />
              {experiments.map((e) => (
                <ReferenceLine
                  key={e.date}
                  x={e.date}
                  stroke="#3b82f6"
                  strokeDasharray="2 2"
                  label={{ value: e.label, fontSize: 10, fill: "#3b82f6" }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-3 text-xs text-ink/60">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-accent" /> weight
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-ink" /> reps
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 border-t border-dashed border-blue-500" />{" "}
            experiment
          </span>
        </div>
      </div>
    </div>
  );
}
