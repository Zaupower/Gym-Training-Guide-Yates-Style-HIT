"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const ERROR_LABELS: Record<string, string> = {
  email_required: "Email is required.",
  email_invalid: "That doesn't look like a valid email.",
  email_taken: "An account with that email already exists.",
  name_required: "Name is required.",
  name_too_short: "Name must be at least 2 characters.",
  password_too_short: "Password must be at least 8 characters.",
  invalid_credentials: "Email or password is incorrect.",
  missing_fields: "Email and password are required.",
};

export default function AuthForm({
  mode,
  nextUrl,
}: {
  mode: "login" | "register";
  nextUrl: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";
  const title = isRegister ? "Create account" : "Sign in";
  const cta = isRegister ? "Create account" : "Sign in";
  const altHref = isRegister
    ? `/login?next=${encodeURIComponent(nextUrl)}`
    : `/register?next=${encodeURIComponent(nextUrl)}`;
  const altLabel = isRegister
    ? "Already have an account? Sign in"
    : "New here? Create an account";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister ? { email, name, password } : { email, password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details: string[] = Array.isArray(data?.details)
          ? data.details
          : data?.error
          ? [data.error]
          : ["unknown_error"];
        setErrors(details);
        return;
      }
      router.push(nextUrl || "/");
      router.refresh();
    } catch {
      setErrors(["unknown_error"]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pt-10">
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">TrainLog</h1>
        <p className="mb-6 text-sm text-ink/60">{title}</p>

        <form onSubmit={onSubmit} className="space-y-3">
          {isRegister && (
            <Field
              label="Name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={setName}
            />
          )}
          <Field
            label="Email"
            type="email"
            autoComplete={isRegister ? "email" : "username"}
            value={email}
            onChange={setEmail}
          />
          <Field
            label="Password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={setPassword}
          />

          {errors.length > 0 && (
            <ul className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {errors.map((e) => (
                <li key={e}>{ERROR_LABELS[e] ?? e}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {cta}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href={altHref} className="text-ink/70 underline">
            {altLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
        {label}
      </span>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm focus:border-ink focus:outline-none"
        required
      />
    </label>
  );
}
