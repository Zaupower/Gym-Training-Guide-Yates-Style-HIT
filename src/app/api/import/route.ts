import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseImport } from "@/lib/import-parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }

  const { sessions, errors } = parseImport(body.text);

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
        date: session.date,
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
                order: sOrder,
              })),
            },
          })),
        },
      },
    });
    created++;
  }

  return NextResponse.json({ created, skipped, parseErrors: errors });
}
