import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import HeaderBar from "@/components/HeaderBar";

export const dynamic = "force-dynamic";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const month = currentMonth();
  const review = await prisma.monthlyReview.findUnique({
    where: { userId_month: { userId: user.id, month } },
    include: { targets: true },
  });
  const experiments = await prisma.experimentMarker.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  const start = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, date: { gte: start, lt: end }, isDraft: false },
    include: { exercises: true },
  });
  const totalSessions = sessions.length;
  const feels = sessions.map((s) => s.overallFeel).filter(Boolean) as string[];
  const flatPct = feels.length
    ? Math.round(
        (feels.filter((f) => f === "flat" || f === "distracted").length /
          feels.length) *
          100
      )
    : 0;

  return (
    <div className="px-4 pt-6">
      <HeaderBar title="Review" subtitle={month} userName={user.name} />

      <section className="mb-4 rounded-2xl border border-black/10 bg-white p-4">
        <div className="text-xs uppercase tracking-wide text-ink/50">
          This month so far
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Stat label="Sessions" value={String(totalSessions)} />
          <Stat label="Flat / distracted" value={`${flatPct}%`} />
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-black/10 bg-white p-4">
        <div className="text-xs uppercase tracking-wide text-ink/50">
          Observations
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm">
          {review?.observations || (
            <span className="text-ink/40">No observations yet.</span>
          )}
        </p>
      </section>

      <section className="mb-4 rounded-2xl border border-black/10 bg-white p-4">
        <div className="text-xs uppercase tracking-wide text-ink/50">
          Targets
        </div>
        {review && review.targets.length > 0 ? (
          <ul className="mt-2 space-y-1.5 text-sm">
            {review.targets.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked={t.achieved}
                  className="h-4 w-4"
                  readOnly
                />
                <span className={t.achieved ? "line-through text-ink/40" : ""}>
                  {t.description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink/40">
            No targets set for this month.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4">
        <div className="text-xs uppercase tracking-wide text-ink/50">
          Recent experiments
        </div>
        {experiments.length === 0 ? (
          <p className="mt-2 text-sm text-ink/40">
            No experiment markers yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {experiments.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-2">
                <span>{e.whatChanged}</span>
                <span className="shrink-0 text-xs text-ink/50">
                  {e.date.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper p-3">
      <div className="text-[10px] uppercase tracking-wide text-ink/50">
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
