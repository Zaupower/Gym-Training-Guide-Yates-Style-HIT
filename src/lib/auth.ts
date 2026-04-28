import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "trainlog_session";
const ALG = "HS256";
// 5 months ≈ 5 * 30 days. Both the JWT exp and the cookie maxAge use this.
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30 * 5;

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    // Dev fallback so local boots cleanly. In production set AUTH_SECRET.
    (process.env.NODE_ENV !== "production"
      ? "dev-only-insecure-secret-change-me-please-1234567890"
      : "");
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  uid: string;
  email: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ uid: payload.uid, email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function readSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    if (typeof payload.uid !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { uid: payload.uid, email: payload.email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await readSessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, name: true },
  });
  return user;
}

/** Throws (redirects) if not signed in. Use in server components/route handlers. */
export async function requireUser(): Promise<{
  id: string;
  email: string;
  name: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    // Caller should handle this with `redirect()`. Importing redirect here would
    // pull next/navigation everywhere, so just throw a typed error.
    const err = new Error("UNAUTHENTICATED");
    err.name = "UnauthenticatedError";
    throw err;
  }
  return user;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
