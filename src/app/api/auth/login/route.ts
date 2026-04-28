import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Same response for "no user" and "wrong password" — avoid user enumeration
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = await createSessionToken({ uid: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
