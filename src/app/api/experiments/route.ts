import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const items = await prisma.experimentMarker.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json();
  if (!body.date || !body.whatChanged) {
    return NextResponse.json({ error: "date and whatChanged required" }, { status: 400 });
  }
  const created = await prisma.experimentMarker.create({
    data: {
      userId: user.id,
      date: new Date(`${body.date}T00:00:00Z`),
      whatChanged: body.whatChanged,
      notes: body.notes ?? "",
    },
  });
  return NextResponse.json(created);
}
