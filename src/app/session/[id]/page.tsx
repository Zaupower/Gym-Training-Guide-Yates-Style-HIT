import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SessionEditor from "@/components/SessionEditor";
import { toDateOnly, type SessionInput, type Unit } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const back = sp.back;
  const session = await prisma.session.findFirst({
    where: { id, userId: user.id },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!session) notFound();

  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  const defaultUnit: Unit = (settings?.unit ?? "kg") as Unit;

  const initial: SessionInput = {
    date: toDateOnly(session.date),
    title: session.title,
    energy: session.energy,
    sleep: session.sleep,
    stress: session.stress,
    overallFeel: session.overallFeel ?? null,
    dietNotes: session.dietNotes,
    dietTags: session.dietTags,
    notes: session.notes,
    isDraft: session.isDraft,
    exercises: session.exercises.map((e) => ({
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
        durationUnit: s.durationUnit ?? null,
      })),
    })),
  };

  return (
    <SessionEditor
      initial={initial}
      existingId={session.id}
      defaultUnit={defaultUnit}
      back={back}
    />
  );
}
