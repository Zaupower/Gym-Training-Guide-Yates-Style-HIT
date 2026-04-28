import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
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

  // Remove pending (draft) sessions created by this plan
  await prisma.session.deleteMany({ where: { planId: id, isDraft: true } });
  await prisma.trainingPlan.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
