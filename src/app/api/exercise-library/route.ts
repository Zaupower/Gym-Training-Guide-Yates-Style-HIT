import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const lib = await prisma.exerciseLibrary.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(lib);
}
