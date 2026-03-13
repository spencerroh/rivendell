import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { datasets, apiKeys, datasetSchemaFields } from "@/db/schema";
import { generateKey } from "@/lib/auth/keys";
import { CreateDatasetSchema } from "@/lib/validation/schemas";
import { generateId } from "@/lib/utils/id";
import { ok, err } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = CreateDatasetSchema.safeParse(body);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const { name, description, dims, metrics } = parsed.data;
  const datasetId = generateId("ds");
  const now = new Date().toISOString();

  const ingestKey = generateKey("ing");
  const adminKey = generateKey("adm");

  // 트랜잭션으로 dataset + keys + schema fields 생성
  db.transaction((tx) => {
    tx.insert(datasets).values({
      id: datasetId,
      name,
      description: description ?? null,
      createdAt: now,
      updatedAt: now,
    }).run();

    tx.insert(apiKeys).values([
      {
        id: generateId("key"),
        datasetId,
        keyType: "ingest",
        keyPrefix: ingestKey.keyPrefix,
        keyHash: ingestKey.hash,
        createdAt: now,
      },
      {
        id: generateId("key"),
        datasetId,
        keyType: "admin",
        keyPrefix: adminKey.keyPrefix,
        keyHash: adminKey.hash,
        createdAt: now,
      },
    ]).run();

    // dim schema fields
    const dimFields = dims ?? [];
    const metricFields = metrics ?? [];

    const schemaValues = [
      ...dimFields.map((d, i) => ({
        id: generateId("sf"),
        datasetId,
        fieldKey: d.key,
        label: d.label,
        fieldType: "dim" as const,
        visible: 1,
        sortOrder: i,
        createdAt: now,
        updatedAt: now,
      })),
      ...metricFields.map((m, i) => ({
        id: generateId("sf"),
        datasetId,
        fieldKey: m.key,
        label: m.label,
        fieldType: "metric" as const,
        visible: 1,
        sortOrder: i,
        createdAt: now,
        updatedAt: now,
      })),
    ];

    if (schemaValues.length > 0) {
      tx.insert(datasetSchemaFields).values(schemaValues).run();
    }
  });

  return ok({
    dataset_id: datasetId,
    ingest_key: ingestKey.raw,
    admin_key: adminKey.raw,
    name,
    created_at: now,
  }, 201);
}
