import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { apiKeys } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { extractBearerToken, generateKey } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { ok, err } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";
import { z } from "zod";

const RotateSchema = z.object({
  key_type: z.enum(["ingest", "admin"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  const rawKey = extractBearerToken(req.headers.get("authorization"));

  const auth = verifyAdminKey(datasetId, rawKey);
  if (!auth.valid) {
    return err("INVALID_KEY", "Invalid or missing admin key", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = RotateSchema.safeParse(body);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "key_type must be 'ingest' or 'admin'", 400);
  }

  const { key_type } = parsed.data;
  const now = new Date().toISOString();
  const prefix = key_type === "ingest" ? "ing" : "adm";
  const newKey = generateKey(prefix);

  db.transaction((tx) => {
    // 기존 키 폐기
    tx.update(apiKeys)
      .set({ revokedAt: now })
      .where(
        and(
          eq(apiKeys.datasetId, datasetId),
          eq(apiKeys.keyType, key_type),
          isNull(apiKeys.revokedAt)
        )
      )
      .run();

    // 신규 키 생성
    tx.insert(apiKeys).values({
      id: generateId("key"),
      datasetId,
      keyType: key_type,
      keyPrefix: newKey.keyPrefix,
      keyHash: newKey.hash,
      createdAt: now,
    }).run();
  });

  return ok({
    key_type,
    new_key: newKey.raw,
    key_prefix: newKey.keyPrefix,
    rotated_at: now,
  });
}
