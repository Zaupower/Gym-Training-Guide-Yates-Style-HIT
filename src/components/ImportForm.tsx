"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";

const EXAMPLE = `WEEKS: 4
START: today

DAY: monday
  Bench Press | chest | w:2x12@40kg, 3x8@80kg
  Incline DB Press | chest | 3x10@30kg

DAY: wednesday
  Squat | legs | w:2x15@60kg, 4x6@100kg
  Leg Press | legs | 3x12@150kg

DAY: friday
  Pull Down | back | 3x10@60kg
  Barbell Row | back | 3x8@70kg`;

interface Result {
  created: number;
  skipped: number;
  parseErrors: { line: number; message: string }[];
}

export default function ImportForm() {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errs = data?.errors?.map((e: { line: number; message: string }) =>
          e.line ? `Line ${e.line}: ${e.message}` : e.message
        );
        setError(errs?.join("\n") ?? data?.error ?? "Import failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Import Training</h1>
      <p className="mb-4 text-sm text-ink/50">
        Paste your training plan or upload a .txt file to create sessions.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-black/20 px-4 py-3 text-sm text-ink/60 hover:border-ink/40">
          <Upload size={16} />
          <span>Upload .txt file</span>
          <input type="file" accept=".txt" className="hidden" onChange={loadFile} />
        </label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          rows={14}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 font-mono text-xs focus:border-ink focus:outline-none"
          required
        />

        {error && (
          <pre className="whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </pre>
        )}

        {result && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            <p className="font-semibold">Import complete</p>
            <p>{result.created} session{result.created !== 1 ? "s" : ""} created</p>
            {result.skipped > 0 && <p>{result.skipped} skipped (date already has a session)</p>}
            {result.parseErrors.length > 0 && (
              <p className="mt-1 text-yellow-700">
                {result.parseErrors.length} warning{result.parseErrors.length !== 1 ? "s" : ""} — some lines were skipped
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Import sessions
        </button>
      </form>
    </div>
  );
}
