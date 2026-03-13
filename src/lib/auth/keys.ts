import crypto from "crypto";

const SALT_SECRET = process.env.KEY_SALT_SECRET ?? "rivendell-default-salt";

export function generateKey(prefix: "ing" | "adm"): {
  raw: string;
  hash: string;
  keyPrefix: string;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const raw = `${prefix}_${token}`;
  const keyPrefix = raw.slice(0, 12); // "ing_xxxxxxxx"
  const hash = hashKey(raw);
  return { raw, hash, keyPrefix };
}

export function hashKey(raw: string): string {
  return crypto.createHmac("sha256", SALT_SECRET).update(raw).digest("hex");
}

export function verifyKey(raw: string, storedHash: string): boolean {
  const hash = hashKey(raw);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}
