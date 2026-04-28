import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "trainlog_session";
const ALG = "HS256";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
];

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev-only-insecure-secret-change-me-please-1234567890"
      : "");
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, getSecret(), { algorithms: [ALG] });
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (valid) return NextResponse.next();

  // API → 401, page → redirect to /login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except static assets and Next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
