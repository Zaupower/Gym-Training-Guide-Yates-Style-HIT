import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseImport } from "@/lib/import-parser";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const plan = await prisma.trainingPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { sessions, errors } = parseImport(plan.content);
  if (sessions.length === 0) {
    return NextResponse.json({ error: "parse_failed", errors }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;

  for (const session of sessions) {
    const existing = await prisma.session.findUnique({
      where: { userId_date: { userId: user.id, date: session.date } },
    });
    if (existing) { skipped++; continue; }

    await prisma.session.create({
      data: {
        userId: user.id,
        planId: id,
        date: session.date,
        title: session.title,
        notes: session.notes,
        isDraft: true,
        exercises: {
          create: session.exercises.map((ex, exOrder) => ({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            order: exOrder,
            sets: {
              create: ex.sets.map((s, sOrder) => ({
                kind: s.kind,
                weight: s.weight,
                unit: s.unit,
                reps: s.reps,
                toFailure: s.toFailure,
                durationUnit: s.durationUnit ?? null,
                order: sOrder,
              })),
            },
          })),
        },
      },
    });
    created++;
  }

  await prisma.trainingPlan.update({ where: { id }, data: { isActive: true } });

  return NextResponse.json({ created, skipped, parseErrors: errors });
}
