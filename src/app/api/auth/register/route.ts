import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  normalizeEmail,
  validateRegistration,
} from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    password?: string;
  };

  const errors = validateRegistration(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "validation", details: errors }, { status: 400 });
  }

  const email = normalizeEmail(body.email!);
  const name = body.name!.trim();
  const password = body.password!;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "validation", details: ["email_taken"] },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      settings: { create: {} },
    },
    select: { id: true, email: true, name: true },
  });

  const token = await createSessionToken({ uid: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ user });
}
