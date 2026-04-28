import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ month: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { month } = await params;
  const review = await prisma.monthlyReview.findUnique({
    where: { userId_month: { userId: user.id, month } },
    include: { targets: true },
  });
  return NextResponse.json(review);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ month: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { month } = await params;
  const body = await req.json();
  const review = await prisma.monthlyReview.upsert({
    where: { userId_month: { userId: user.id, month } },
    create: { userId: user.id, month, observations: body.observations ?? "" },
    update: { observations: body.observations ?? "" },
  });
  return NextResponse.json(review);
}
