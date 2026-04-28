import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import HeaderBar from "@/components/HeaderBar";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      ...(q
        ? { exercises: { some: { name: { contains: q, mode: "insensitive" } } } }
        : {}),
    },
    orderBy: { date: "desc" },
    take: 200,
    include: { exercises: { include: { sets: true } } },
  });

  return (
    <div className="px-4 pt-6">
      <HeaderBar title="History" userName={user.name} />
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search exercise…"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm focus:border-ink focus:outline-none"
        />
      </form>
      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-ink/50">
          No sessions yet. Tap a date on the calendar to log one.
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const exNames = s.exercises.map((e) => e.name).join(" · ");
            return (
              <li key={s.id}>
                <Link
                  href={`/session/${s.id}`}
                  className="block rounded-xl border border-black/10 bg-white p-3 hover:bg-black/[0.02]"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold">
                      {toDateOnly(s.date)}
                    </span>
                    <span className="text-xs text-ink/50">
                      {s.exercises.length} exercise
                      {s.exercises.length === 1 ? "" : "s"}
                      {s.isDraft ? " · draft" : ""}
                    </span>
                  </div>
                  {exNames && (
                    <div className="mt-1 line-clamp-1 text-xs text-ink/60">
                      {exNames}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
