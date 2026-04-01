import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { datasetSchemaFields } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { isNoSecureMode } from "@/lib/auth/noSecureMode";
import { UpdateSchemaSchema } from "@/lib/validation/schemas";
import { ok, err } from "@/lib/utils/response";
import { generateId } from "@/lib/utils/id";

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
    return err("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = UpdateSchemaSchema.safeParse(body);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const { dims, metrics } = parsed.data;
  const now = new Date().toISOString();

  // Fetch existing fields once before transaction
  const existingFields = db
    .select()
    .from(datasetSchemaFields)
    .where(eq(datasetSchemaFields.datasetId, datasetId))
    .all();
  const existingMap = new Map(existingFields.map((f) => [f.fieldKey, f]));

  db.transaction((tx) => {
    dims?.forEach((d) => {
      const existing = existingMap.get(d.key);
      if (existing) {
        tx.update(datasetSchemaFields)
          .set({ label: d.label ?? "", visible: d.visible ? 1 : 0, updatedAt: now })
          .where(eq(datasetSchemaFields.id, existing.id))
          .run();
      } else {
        tx.insert(datasetSchemaFields)
          .values({
            id: generateId("sf"),
            datasetId,
            fieldKey: d.key,
            label: d.label ?? "",
            fieldType: "dim",
            visible: d.visible ? 1 : 0,
            sortOrder: parseInt(d.key.replace("dim", "")) - 1,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    });

    metrics?.forEach((m) => {
      const existing = existingMap.get(m.key);
      if (existing) {
        tx.update(datasetSchemaFields)
          .set({ label: m.label ?? "", visible: m.visible ? 1 : 0, updatedAt: now })
          .where(eq(datasetSchemaFields.id, existing.id))
          .run();
      } else {
        tx.insert(datasetSchemaFields)
          .values({
            id: generateId("sf"),
            datasetId,
            fieldKey: m.key,
            label: m.label ?? "",
            fieldType: "metric",
            visible: m.visible ? 1 : 0,
            sortOrder: parseInt(m.key.replace("metric", "")) - 1,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    });
  });

  const schemaFields = db
    .select()
    .from(datasetSchemaFields)
    .where(eq(datasetSchemaFields.datasetId, datasetId))
    .all();

  return ok({
    schema_fields: schemaFields.map((f) => ({
      field_key: f.fieldKey,
      label: f.label,
      field_type: f.fieldType,
      visible: f.visible === 1,
      sort_order: f.sortOrder,
    })),
  });
}
