import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/types";
import { computeWarnings } from "@/lib/warnings";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Calendar from "@/components/Calendar";
import WarningsBanner from "@/components/WarningsBanner";
import HeaderBar from "@/components/HeaderBar";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const now = new Date();
  const [yStr, mStr] = (sp.m ?? "").split("-");
  const year = Number.isFinite(+yStr) && yStr ? +yStr : now.getFullYear();
  const month = Number.isFinite(+mStr) && mStr ? +mStr - 1 : now.getMonth();

  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));

  const [sessions, experiments, settings, warnings] = await Promise.all([
    prisma.session.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
      include: { exercises: true },
    }),
    prisma.experimentMarker.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
    }),
    prisma.settings.findUnique({ where: { userId: user.id } }),
    computeWarnings({ userId: user.id }),
  ]);

  const sessionsByDate: Record<
    string,
    { id: string; isDraft: boolean; exerciseCount: number }
  > = {};
  for (const s of sessions) {
    sessionsByDate[toDateOnly(s.date)] = {
      id: s.id,
      isDraft: s.isDraft,
      exerciseCount: s.exercises.length,
    };
  }
  const experimentDates = new Set(experiments.map((e) => toDateOnly(e.date)));

  return (
    <div className="px-4 pt-6">
      <HeaderBar
        title="TrainLog"
        subtitle={`${settings?.unit === "lb" ? "lb" : "kg"} · weekly target ${
          settings?.weeklyTarget ?? 3
        }`}
        userName={user.name}
      />

      {warnings.length > 0 && <WarningsBanner warnings={warnings} />}

      <Calendar
        year={year}
        month={month}
        sessionsByDate={sessionsByDate}
        experimentDates={[...experimentDates]}
      />
    </div>
  );
}
