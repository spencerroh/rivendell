import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { datasets, apiKeys, datasetSchemaFields } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { isNoSecureMode } from "@/lib/auth/noSecureMode";
import { ok, err } from "@/lib/utils/response";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  if (!isNoSecureMode()) {
    const rawKey = extractBearerToken(req.headers.get("authorization"));
    const auth = verifyAdminKey(datasetId, rawKey);
    if (!auth.valid) {
      return err("INVALID_KEY", "Invalid or missing admin key", 401);
    }
  }

  const dataset = db.select().from(datasets).where(eq(datasets.id, datasetId)).get();
  if (!dataset) {
    return err("DATASET_NOT_FOUND", "Dataset not found", 404);
  }

  const schemaFields = db
    .select()
    .from(datasetSchemaFields)
    .where(eq(datasetSchemaFields.datasetId, datasetId))
    .all();

  const keys = db
    .select({
      keyType: apiKeys.keyType,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.datasetId, datasetId), isNull(apiKeys.revokedAt)))
    .all();

  return ok({
    id: dataset.id,
    name: dataset.name,
    description: dataset.description,
    created_at: dataset.createdAt,
    updated_at: dataset.updatedAt,
    schema_fields: schemaFields.map((f) => ({
      field_key: f.fieldKey,
      label: f.label,
      field_type: f.fieldType,
      visible: f.visible === 1,
      sort_order: f.sortOrder,
    })),
    keys: keys.map((k) => ({
      key_type: k.keyType,
      key_prefix: k.keyPrefix,
      last_used_at: k.lastUsedAt,
    })),
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  if (!isNoSecureMode()) {
    const rawKey = extractBearerToken(req.headers.get("authorization"));
    const auth = verifyAdminKey(datasetId, rawKey);
    if (!auth.valid) {
      return err("INVALID_KEY", "Invalid or missing admin key", 401);
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("INVALID_JSON", "요청 본문이 올바르지 않습니다.", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.", 400);
  }

  const { name, description } = parsed.data;
  if (!name && description === undefined) {
    return err("NOTHING_TO_UPDATE", "변경할 항목이 없습니다.", 400);
  }

  db.update(datasets)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(datasets.id, datasetId))
    .run();

  const updated = db.select().from(datasets).where(eq(datasets.id, datasetId)).get();
  return ok({ id: updated!.id, name: updated!.name, description: updated!.description });
}
