import { AlertTriangle } from "lucide-react";
import type { Warning } from "@/lib/warnings";

export default function WarningsBanner({ warnings }: { warnings: Warning[] }) {
  return (
    <div className="mb-4 space-y-2">
      {warnings.map((w, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide">
              {w.kind.replace("_", " ")}
            </div>
            <div>{w.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
