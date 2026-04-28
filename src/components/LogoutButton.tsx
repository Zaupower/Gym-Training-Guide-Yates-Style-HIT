"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-ink/70 hover:bg-black/5"
    >
      <LogOut size={14} /> Sign out
    </button>
  );
}
