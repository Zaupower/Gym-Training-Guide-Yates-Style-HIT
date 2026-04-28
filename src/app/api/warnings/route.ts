import { NextResponse } from "next/server";
import { computeWarnings } from "@/lib/warnings";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  const warnings = await computeWarnings({
    userId: user.id,
    deloadAfterWeeks: settings?.deloadAfterWeeks ?? 6,
  });
  return NextResponse.json(warnings);
}
