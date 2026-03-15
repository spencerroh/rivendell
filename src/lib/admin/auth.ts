import crypto from "crypto";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "rivendell-admin-default-secret";
}

/** 24시간 유효한 세션 토큰 생성 (Node.js crypto, API Route 전용) */
export function createAdminToken(): string {
  const payload = JSON.stringify({
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 86400,
  });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

/** 세션 토큰 검증 (Node.js crypto, API Route / Server Component 전용) */
export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;

    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(payloadB64)
      .digest("base64url");

    const sigBuf = Buffer.from(sig + "==", "base64url");
    const expectedBuf = Buffer.from(expectedSig + "==", "base64url");
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** 비밀번호 상수 시간 비교 */
export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  try {
    const inputBuf = Buffer.from(input);
    const expectedBuf = Buffer.from(expected);
    if (inputBuf.length !== expectedBuf.length) {
      // 길이 다르면 무조건 false지만 타이밍 공격 방지를 위해 비교 수행
      crypto.timingSafeEqual(
        Buffer.alloc(expectedBuf.length),
        Buffer.alloc(expectedBuf.length)
      );
      return false;
    }
    return crypto.timingSafeEqual(inputBuf, expectedBuf);
  } catch {
    return false;
  }
}
