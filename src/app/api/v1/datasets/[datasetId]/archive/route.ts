import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { datasets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { ok, err } from "@/lib/utils/response";

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

  const dataset = db.select().from(datasets).where(eq(datasets.id, datasetId)).get();
  if (!dataset) {
    return err("DATASET_NOT_FOUND", "Dataset not found", 404);
  }
  if (dataset.archivedAt) {
    return err("ALREADY_ARCHIVED", "Dataset is already archived", 409);
  }

  db.update(datasets)
    .set({ archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(datasets.id, datasetId))
    .run();

  return ok({ archived: true });
}
