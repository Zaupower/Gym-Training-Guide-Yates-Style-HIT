import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SessionInput } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { userId: user.id };
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}),
      ...(to ? { lte: new Date(`${to}T00:00:00Z`) } : {}),
    };
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json()) as SessionInput;
  if (!body.date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }
  const dateObj = new Date(`${body.date}T00:00:00Z`);

  const saved = await prisma.$transaction(async (tx) => {
    const libUpserts = (body.exercises ?? []).map((ex) =>
      tx.exerciseLibrary.upsert({
        where: { userId_name: { userId: user.id, name: ex.name.trim() } },
        create: { userId: user.id, name: ex.name.trim(), muscleGroup: ex.muscleGroup },
        update: { muscleGroup: ex.muscleGroup },
      })
    );
    await Promise.all(libUpserts);

    const existing = await tx.session.findUnique({
      where: { userId_date: { userId: user.id, date: dateObj } },
    });
    if (existing) {
      await tx.exercise.deleteMany({ where: { sessionId: existing.id } });
    }

    const session = await tx.session.upsert({
      where: { userId_date: { userId: user.id, date: dateObj } },
      create: {
        userId: user.id,
        date: dateObj,
        energy: body.energy ?? null,
        sleep: body.sleep ?? null,
        stress: body.stress ?? null,
        overallFeel: body.overallFeel ?? null,
        dietNotes: body.dietNotes ?? "",
        dietTags: body.dietTags ?? [],
        notes: body.notes ?? "",
        isDraft: body.isDraft ?? false,
      },
      update: {
        energy: body.energy ?? null,
        sleep: body.sleep ?? null,
        stress: body.stress ?? null,
        overallFeel: body.overallFeel ?? null,
        dietNotes: body.dietNotes ?? "",
        dietTags: body.dietTags ?? [],
        notes: body.notes ?? "",
        isDraft: body.isDraft ?? false,
      },
    });

    for (let i = 0; i < (body.exercises ?? []).length; i++) {
      const ex = body.exercises[i];
      await tx.exercise.create({
        data: {
          sessionId: session.id,
          name: ex.name.trim(),
          muscleGroup: ex.muscleGroup,
          preExhaustWith: ex.preExhaustWith ?? null,
          notes: ex.notes ?? "",
          order: i,
          sets: {
            create: (ex.sets ?? []).map((s, j) => ({
              kind: s.kind,
              weight: s.weight,
              unit: s.unit,
              reps: s.reps,
              toFailure: s.toFailure,
              durationUnit: s.durationUnit ?? null,
              order: j,
            })),
          },
        },
      });
    }

    return tx.session.findUnique({
      where: { id: session.id },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
    });
  });

  return NextResponse.json(saved);
}
