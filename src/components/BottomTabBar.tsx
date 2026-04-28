"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, History, LineChart, ClipboardList, Dumbbell } from "lucide-react";

const tabs = [
  { href: "/", label: "Calendar", icon: CalendarDays },
  { href: "/history", label: "History", icon: History },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/review", label: "Review", icon: ClipboardList },
  { href: "/plans", label: "Plans", icon: Dumbbell },
];

const HIDDEN_ON = ["/login", "/register"];

export default function BottomTabBar() {
  const pathname = usePathname();
  if (pathname && HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                active ? "text-accent" : "text-ink/60"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
