import { prisma } from "@/lib/prisma";
import ProgressChart from "@/components/ProgressChart";
import { toDateOnly } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import HeaderBar from "@/components/HeaderBar";

export const dynamic = "force-dynamic";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ ex?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const exercises = await prisma.exerciseLibrary.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  const selected = sp.ex ?? exercises[0]?.name ?? null;

  let series: { date: string; weight: number; reps: number; volume: number }[] = [];
  if (selected) {
    const rows = await prisma.exercise.findMany({
      where: { name: selected, session: { userId: user.id } },
      include: {
        sets: { where: { kind: "working" } },
        session: true,
      },
      orderBy: { session: { date: "asc" } },
    });
    series = rows
      .filter((r) => r.sets.length > 0)
      .map((r) => {
        const s = r.sets[0];
        return {
          date: toDateOnly(r.session.date),
          weight: s.weight,
          reps: s.reps,
          volume: s.weight * s.reps,
        };
      });
  }

  const experiments = await prisma.experimentMarker.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  return (
    <div className="px-4 pt-6">
      <HeaderBar title="Progress" userName={user.name} />
      {exercises.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-ink/50">
          Log a session first — exercises will appear here for charting.
        </p>
      ) : (
        <>
          <form className="mb-3 flex gap-2">
            <select
              name="ex"
              defaultValue={selected ?? ""}
              className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
            >
              {exercises.map((e) => (
                <option key={e.name} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl border border-black/10 bg-white px-4 text-sm"
            >
              View
            </button>
          </form>
          <ProgressChart
            series={series}
            experiments={experiments.map((e) => ({
              date: toDateOnly(e.date),
              label: e.whatChanged,
            }))}
          />
        </>
      )}
    </div>
  );
}
