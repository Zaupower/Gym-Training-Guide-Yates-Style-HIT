"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
        <p className="mb-6 text-sm text-ink/60">Reset your password</p>

        {sent ? (
          <p className="text-sm text-ink/70">
            If that email is registered you&apos;ll receive a reset link shortly.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm focus:border-ink focus:outline-none"
                required
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
              Send reset link
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-ink/70 underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
