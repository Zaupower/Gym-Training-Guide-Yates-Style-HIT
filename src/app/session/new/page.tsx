import { prisma } from "@/lib/prisma";
import SessionEditor from "@/components/SessionEditor";
import { todayIso, type SessionInput, type Unit } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; back?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const date = sp.date ?? todayIso();
  const back = sp.back;

  const existing = await prisma.session.findUnique({
    where: { userId_date: { userId: user.id, date: new Date(`${date}T00:00:00Z`) } },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  const defaultUnit: Unit = (settings?.unit ?? "kg") as Unit;

  const initial: SessionInput = existing
    ? {
        date,
        energy: existing.energy,
        sleep: existing.sleep,
        stress: existing.stress,
        overallFeel: existing.overallFeel ?? null,
        dietNotes: existing.dietNotes,
        dietTags: existing.dietTags,
        notes: existing.notes,
        isDraft: existing.isDraft,
        exercises: existing.exercises.map((e) => ({
          name: e.name,
          muscleGroup: e.muscleGroup,
          preExhaustWith: e.preExhaustWith,
          notes: e.notes,
          sets: e.sets.map((s) => ({
            kind: s.kind,
            weight: s.weight,
            unit: s.unit,
            reps: s.reps,
            toFailure: s.toFailure,
          })),
        })),
      }
    : {
        date,
        energy: null,
        sleep: null,
        stress: null,
        overallFeel: null,
        dietNotes: "",
        dietTags: [],
        notes: "",
        isDraft: true,
        exercises: [],
      };

  return (
    <SessionEditor
      initial={initial}
      existingId={existing?.id}
      defaultUnit={defaultUnit}
      back={back}
    />
  );
}
