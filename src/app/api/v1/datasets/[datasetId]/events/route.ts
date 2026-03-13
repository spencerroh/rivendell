import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq, and, gte, lte, like, SQL } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { EventsQuerySchema } from "@/lib/validation/schemas";
import { ok, err } from "@/lib/utils/response";
import { sql } from "drizzle-orm";
import { z } from "zod";

type EventsQuery = z.infer<typeof EventsQuerySchema>;

const DIM_MAP = {
  dim1: events.dim1, dim2: events.dim2, dim3: events.dim3,
  dim4: events.dim4, dim5: events.dim5, dim6: events.dim6,
  dim7: events.dim7, dim8: events.dim8, dim9: events.dim9,
  dim10: events.dim10,
} as const;

function buildEventFilters(datasetId: string, q: EventsQuery) {
  const conditions: SQL[] = [eq(events.datasetId, datasetId)];

  if (q.from) conditions.push(gte(events.occurredAt, q.from));
  if (q.to) conditions.push(lte(events.occurredAt, q.to));
  if (q.event_name) conditions.push(eq(events.eventName, q.event_name));
  if (q.actor_id) conditions.push(eq(events.actorId, q.actor_id));
  if (q.source) conditions.push(eq(events.source, q.source));
  if (q.status) conditions.push(eq(events.status, q.status));
  if (q.dim_col && q.dim_val) {
    conditions.push(like(DIM_MAP[q.dim_col], `%${q.dim_val}%`));
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  const rawKey = extractBearerToken(req.headers.get("authorization"));

  const auth = verifyAdminKey(datasetId, rawKey);
  if (!auth.valid) {
    return err("INVALID_KEY", "Invalid or missing admin key", 401);
  }

  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = EventsQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const q = parsed.data;
  const where = buildEventFilters(datasetId, q);
  const offset = (q.page - 1) * q.page_size;

  const [rows, countResult] = [
    db.select().from(events).where(where).orderBy(sql`${events.occurredAt} DESC`).limit(q.page_size).offset(offset).all(),
    db.select({ count: sql<number>`count(*)` }).from(events).where(where).get(),
  ];

  const total = countResult?.count ?? 0;
  const totalPages = Math.ceil(total / q.page_size);

  return ok({
    data: rows,
    total,
    page: q.page,
    page_size: q.page_size,
    total_pages: totalPages,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  const rawKey = extractBearerToken(req.headers.get("authorization"));

  const auth = verifyAdminKey(datasetId, rawKey);
  if (!auth.valid) {
    return err("INVALID_KEY", "Invalid or missing admin key", 401);
  }

  const result = db.delete(events).where(eq(events.datasetId, datasetId)).run();
  return ok({ deleted: result.changes });
}
