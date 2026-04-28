import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

  // Only remove sessions that haven't been logged yet (still drafts)
  const { count } = await prisma.session.deleteMany({
    where: { planId: id, isDraft: true },
  });

  await prisma.trainingPlan.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ removed: count });
}
