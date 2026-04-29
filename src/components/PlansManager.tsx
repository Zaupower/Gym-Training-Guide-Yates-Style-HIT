"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Play, Square, ChevronDown, ChevronUp } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

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

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // planId being toggled/deleted
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/plans");
    const data = await res.json();
    setPlans(data.plans ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!name) setName(file.name.replace(/\.txt$/i, ""));
    const reader = new FileReader();
    reader.onload = (ev) => setContent(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
      if (!res.ok) { setMessage("Failed to save plan."); return; }
      const data = await res.json();
      setName(""); setContent(""); setShowAdd(false);
      if (data.count > 1) setMessage(`✓ ${data.count} plans imported.`);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(plan: Plan) {
    setBusy(plan.id);
    setMessage("");
    const action = plan.isActive ? "deactivate" : "activate";
    try {
      const res = await fetch(`/api/plans/${plan.id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.errors?.map((e: { message: string }) => e.message).join(", ") ?? "Failed.");
      } else if (action === "activate") {
        setMessage(`✓ ${data.created} session${data.created !== 1 ? "s" : ""} added to calendar${data.skipped ? `, ${data.skipped} skipped` : ""}.`);
      } else {
        setMessage(`✓ Plan deactivated, ${data.removed} pending session${data.removed !== 1 ? "s" : ""} removed.`);
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function deletePlan(plan: Plan) {
    if (!confirm(`Delete "${plan.name}"? This will also remove its pending sessions from the calendar.`)) return;
    setBusy(plan.id);
    setMessage("");
    try {
      await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Training Plans</h1>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white"
        >
          {showAdd ? <ChevronUp size={16} /> : <Plus size={16} />}
          {showAdd ? "Cancel" : "Add plan"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={onAdd} className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-ink/50">Plan name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push Pull Legs — Week 1-4"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:border-ink focus:outline-none"
              required
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-black/20 px-4 py-3 text-sm text-ink/60 hover:border-ink/40">
            <span>Upload .txt file</span>
            <input type="file" accept=".txt" className="hidden" onChange={loadFile} />
          </label>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={EXAMPLE}
            rows={10}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs focus:border-ink focus:outline-none"
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save plan
          </button>
        </form>
      )}

      {message && (
        <p className="rounded-lg border border-black/10 bg-white p-3 text-sm text-ink/70">{message}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-ink/30" /></div>
      ) : plans.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/40">No plans yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {plans.map((plan) => (
            <li key={plan.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{plan.name}</p>
                <p className="text-xs text-ink/40">{new Date(plan.createdAt).toLocaleDateString()}</p>
              </div>

              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${plan.isActive ? "bg-green-100 text-green-700" : "bg-black/5 text-ink/50"}`}>
                {plan.isActive ? "Active" : "Inactive"}
              </span>

              <button
                onClick={() => toggle(plan)}
                disabled={busy === plan.id}
                title={plan.isActive ? "Deactivate" : "Activate"}
                className="shrink-0 rounded-lg p-1.5 text-ink/50 hover:bg-black/5 disabled:opacity-40"
              >
                {busy === plan.id ? <Loader2 size={16} className="animate-spin" /> : plan.isActive ? <Square size={16} /> : <Play size={16} />}
              </button>

              <button
                onClick={() => deletePlan(plan)}
                disabled={busy === plan.id}
                title="Delete plan"
                className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
