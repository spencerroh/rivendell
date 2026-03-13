import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { events, datasets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyIngestKey } from "@/lib/auth/verifyApiKey";
import { IngestBatchSchema } from "@/lib/validation/schemas";
import { generateId } from "@/lib/utils/id";
import { ok, err } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = IngestBatchSchema.safeParse(body);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const { dataset_id, events: eventList } = parsed.data;

  // dataset 존재 확인
  const dataset = db.select().from(datasets).where(eq(datasets.id, dataset_id)).get();
  if (!dataset) {
    return err("DATASET_NOT_FOUND", "Dataset not found", 404);
  }
  if (dataset.archivedAt) {
    return err("DATASET_ARCHIVED", "Dataset is archived and not accepting new events", 410);
  }

  // ingest_key 검증
  const rawKey = extractBearerToken(req.headers.get("authorization"));
  const auth = verifyIngestKey(dataset_id, rawKey);
  if (!auth.valid) {
    return err("INVALID_KEY", "Invalid or missing ingest key", 401);
  }

  const now = new Date().toISOString();
  const results: { index: number; status: "accepted" | "rejected"; reason?: string }[] = [];
  let accepted = 0;
  let failed = 0;

  db.transaction((tx) => {
    eventList.forEach((event, index) => {
      try {
        tx.insert(events).values({
          id: generateId("ev"),
          datasetId: dataset_id,
          eventName: event.event_name,
          actorId: event.actor_id ?? null,
          sessionId: event.session_id ?? null,
          source: event.source ?? null,
          status: event.status ?? null,
          occurredAt: event.occurred_at ?? now,
          receivedAt: now,
          dim1: event.dim1 ?? null,
          dim2: event.dim2 ?? null,
          dim3: event.dim3 ?? null,
          dim4: event.dim4 ?? null,
          dim5: event.dim5 ?? null,
          dim6: event.dim6 ?? null,
          dim7: event.dim7 ?? null,
          dim8: event.dim8 ?? null,
          dim9: event.dim9 ?? null,
          dim10: event.dim10 ?? null,
          metric1: event.metric1 ?? null,
          metric2: event.metric2 ?? null,
          metric3: event.metric3 ?? null,
          payloadJson: event.payload ? JSON.stringify(event.payload) : null,
          createdAt: now,
        }).run();
        results.push({ index, status: "accepted" });
        accepted++;
      } catch (e) {
        results.push({ index, status: "rejected", reason: String(e) });
        failed++;
      }
    });
  });

  return ok({ dataset_id, accepted, failed, results }, 200);
}
