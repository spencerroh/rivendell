import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { events, datasetSchemaFields } from "@/db/schema";
import { eq, and, gte, lte, like, SQL } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { ExportQuerySchema } from "@/lib/validation/schemas";
import { err } from "@/lib/utils/response";
import { sql } from "drizzle-orm";
import type { EventRow, SchemaField } from "@/types";
import { buildHeaders, buildRow } from "@/lib/export/buildRows";

const MAX_ROWS = parseInt(process.env.EXPORT_MAX_ROWS ?? "10000");

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
  const parsed = ExportQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const DIM_MAP = {
    dim1: events.dim1, dim2: events.dim2, dim3: events.dim3,
    dim4: events.dim4, dim5: events.dim5, dim6: events.dim6,
    dim7: events.dim7, dim8: events.dim8, dim9: events.dim9,
    dim10: events.dim10,
  } as const;

  const q = parsed.data;
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

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  // 행 수 제한 확인
  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(events)
    .where(where)
    .get();
  const total = countResult?.count ?? 0;

  if (total > MAX_ROWS) {
    return err(
      "EXPORT_LIMIT_EXCEEDED",
      `Result has ${total} rows, exceeding the limit of ${MAX_ROWS}. Please narrow your filters.`,
      400
    );
  }

  const rows = db
    .select()
    .from(events)
    .where(where)
    .orderBy(sql`${events.occurredAt} DESC`)
    .all() as EventRow[];

  const schemaFields = db
    .select()
    .from(datasetSchemaFields)
    .where(eq(datasetSchemaFields.datasetId, datasetId))
    .all() as SchemaField[];

  const headers = buildHeaders(schemaFields, {
    visibleOnly: q.visible_only,
    includePayload: q.include_payload,
  });
  const dataRows = rows.map((e) =>
    buildRow(e, schemaFields, {
      visibleOnly: q.visible_only,
      includePayload: q.include_payload,
    })
  );

  const date = new Date().toISOString().slice(0, 10);
  const filename = `export-${datasetId}-${date}.json`;

  return new NextResponse(
    JSON.stringify({ headers, data: dataRows }, null, 2),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    }
  );
}
