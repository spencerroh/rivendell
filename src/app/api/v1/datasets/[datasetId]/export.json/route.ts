import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { events, datasetSchemaFields } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { isNoSecureMode } from "@/lib/auth/noSecureMode";
import { ExportQuerySchema } from "@/lib/validation/schemas";
import { err } from "@/lib/utils/response";
import { sql } from "drizzle-orm";
import type { EventRow, SchemaField } from "@/types";
import { buildHeaders, buildRow } from "@/lib/export/buildRows";
import { buildEventConditions } from "@/lib/query/buildEventConditions";

const MAX_ROWS = parseInt(process.env.EXPORT_MAX_ROWS ?? "10000");

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

  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = ExportQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const q = parsed.data;
  const where = buildEventConditions(datasetId, q);

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
