import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body" } }, { status: 400 });
  }

  const password = (body as Record<string, unknown>)?.password;
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: { code: "MISSING_PASSWORD", message: "Password required" } }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    // 브루트포스 완화: 100ms 지연
    await new Promise((r) => setTimeout(r, 100));
    return NextResponse.json({ error: { code: "INVALID_PASSWORD", message: "Invalid password" } }, { status: 401 });
  }

  const token = createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
