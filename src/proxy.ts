import { NextRequest, NextResponse } from "next/server";

// ─── Admin Session Verification (Web Crypto — Edge compatible) ──────────────

const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET ?? "rivendell-admin-default-secret";

function b64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function verifyAdminToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(ADMIN_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = b64urlDecode(sigB64).buffer as ArrayBuffer;
    const dataBytes = enc.encode(payloadB64).buffer as ArrayBuffer;
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return false;
    const payloadStr = new TextDecoder().decode(b64urlDecode(payloadB64));
    const payload = JSON.parse(payloadStr);
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// ─── Proxy (Middleware) ─────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // 로그인 페이지는 보호 제외
    if (pathname === "/admin/login") return NextResponse.next();

    const token = request.cookies.get("admin_session")?.value;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── Dataset key cookie handling ─────────────────────────────────────────
  const match = pathname.match(/^\/datasets\/([^/]+)(?:\/|$)/);
  if (match) {
    const datasetId = match[1];
    if (datasetId === "new") return NextResponse.next();

    const key = searchParams.get("key");

    if (key) {
      // ?key= 제거한 URL로 리다이렉트 + 쿠키 설정
      const url = request.nextUrl.clone();
      url.searchParams.delete("key");

      const response = NextResponse.redirect(url);
      response.cookies.set(`rivendell_key_${datasetId}`, key, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      response.cookies.set("rivendell_current_dataset", datasetId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }

    // key 파람 없이 데이터셋 방문 시에도 current_dataset 쿠키 갱신
    const existingKey = request.cookies.get(`rivendell_key_${datasetId}`)?.value;
    if (existingKey) {
      const response = NextResponse.next();
      response.cookies.set("rivendell_current_dataset", datasetId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/datasets/:path*", "/admin", "/admin/:path*"],
};
