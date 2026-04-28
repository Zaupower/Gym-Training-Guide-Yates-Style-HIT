import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(body.email ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success to prevent user enumeration
    return NextResponse.json({ ok: true });
  }

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });

  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`);

  return NextResponse.json({ ok: true });
}
