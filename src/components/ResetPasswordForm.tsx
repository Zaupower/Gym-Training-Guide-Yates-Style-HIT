"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.error === "invalid_or_expired_token"
            ? "This link has expired or already been used."
            : data?.details?.[0] === "password_too_short"
            ? "Password must be at least 8 characters."
            : "Something went wrong. Please try again."
        );
        return;
      }
      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pt-10">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">TrainLog</h1>
        <p className="mb-6 text-sm text-ink/60">Choose a new password</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              New password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm focus:border-ink focus:outline-none"
              required
              minLength={8}
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Set new password
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-ink/70 underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
