import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { sql, isNotNull } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { isNoSecureMode } from "@/lib/auth/noSecureMode";
import { BreakdownQuerySchema } from "@/lib/validation/metricsSchemas";
import { buildEventConditions } from "@/lib/query/buildEventConditions";
import { ok, err } from "@/lib/utils/response";
import { and } from "drizzle-orm";

const GROUP_BY_COL_MAP = {
  event_name: events.eventName,
  status: events.status,
  source: events.source,
  actor_id: events.actorId,
  dim1: events.dim1,
  dim2: events.dim2,
  dim3: events.dim3,
  dim4: events.dim4,
  dim5: events.dim5,
  dim6: events.dim6,
  dim7: events.dim7,
  dim8: events.dim8,
  dim9: events.dim9,
  dim10: events.dim10,
} as const;

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
  const parsed = BreakdownQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const { group_by, limit, ...filters } = parsed.data;
  const col = GROUP_BY_COL_MAP[group_by];
  const baseWhere = buildEventConditions(datasetId, filters);
  const where = and(baseWhere, isNotNull(col));

  const rows = db
    .select({
      label: col,
      count: sql<number>`count(*)`,
    })
    .from(events)
    .where(where)
    .groupBy(col)
    .orderBy(sql`count(*) DESC`)
    .limit(limit)
    .all();

  return ok({
    group_by,
    rows: rows.map((r) => ({ label: r.label, count: r.count })),
  });
}
