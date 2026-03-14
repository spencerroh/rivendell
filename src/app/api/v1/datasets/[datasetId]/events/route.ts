import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { EventsQuerySchema } from "@/lib/validation/schemas";
import { ok, err } from "@/lib/utils/response";
import { sql } from "drizzle-orm";
import { buildEventConditions } from "@/lib/query/buildEventConditions";

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
  const where = buildEventConditions(datasetId, q);
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
