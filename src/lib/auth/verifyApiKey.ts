import { db } from "@/db/client";
import { apiKeys } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { verifyKey, hashKey } from "./keys";

/** admin_key만으로 datasetId를 찾아 반환. 없으면 null. */
export function findDatasetByAdminKey(rawKey: string): string | null {
  if (!rawKey) return null;
  const hash = hashKey(rawKey);
  const found = db
    .select({ datasetId: apiKeys.datasetId })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, hash),
        eq(apiKeys.keyType, "admin"),
        isNull(apiKeys.revokedAt)
      )
    )
    .get();
  return found?.datasetId ?? null;
}

export function verifyAdminKey(
  datasetId: string,
  rawKey: string | null
): { valid: boolean; keyId?: string } {
  if (!rawKey) return { valid: false };

  const activeKey = db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.datasetId, datasetId),
        eq(apiKeys.keyType, "admin"),
        isNull(apiKeys.revokedAt)
      )
    )
    .get();

  if (!activeKey) return { valid: false };
  if (!verifyKey(rawKey, activeKey.keyHash)) return { valid: false };

  // last_used_at 업데이트 (응답 차단 안 함)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, activeKey.id))
    .run();

  return { valid: true, keyId: activeKey.id };
}

export function verifyIngestKey(
  datasetId: string,
  rawKey: string | null
): { valid: boolean; keyId?: string } {
  if (!rawKey) return { valid: false };

  const activeKey = db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.datasetId, datasetId),
        eq(apiKeys.keyType, "ingest"),
        isNull(apiKeys.revokedAt)
      )
    )
    .get();

  if (!activeKey) return { valid: false };
  if (!verifyKey(rawKey, activeKey.keyHash)) return { valid: false };

  db.update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, activeKey.id))
    .run();

  return { valid: true, keyId: activeKey.id };
}
