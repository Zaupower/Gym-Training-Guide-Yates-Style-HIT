import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const plans = await prisma.trainingPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { name?: string; content?: string };
  if (!body.name?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "name and content are required" }, { status: 400 });
  }

  const plan = await prisma.trainingPlan.create({
    data: { userId: user.id, name: body.name.trim(), content: body.content.trim() },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
