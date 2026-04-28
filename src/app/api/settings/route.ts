import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getOrCreate(userId: string) {
  let s = await prisma.settings.findUnique({ where: { userId } });
  if (!s) s = await prisma.settings.create({ data: { userId } });
  return s;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json(await getOrCreate(user.id));
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json();
  await getOrCreate(user.id);
  const updated = await prisma.settings.update({
    where: { userId: user.id },
    data: {
      unit: body.unit,
      deloadAfterWeeks: body.deloadAfterWeeks,
      weeklyTarget: body.weeklyTarget,
    },
  });
  return NextResponse.json(updated);
}
