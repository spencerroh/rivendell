import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { sql } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { isNoSecureMode } from "@/lib/auth/noSecureMode";
import { TimeseriesQuerySchema } from "@/lib/validation/metricsSchemas";
import { buildEventConditions } from "@/lib/query/buildEventConditions";
import { ok, err } from "@/lib/utils/response";

const METRIC_COL_MAP = {
  metric1: events.metric1, metric2: events.metric2, metric3: events.metric3,
  metric4: events.metric4, metric5: events.metric5, metric6: events.metric6,
  metric7: events.metric7, metric8: events.metric8, metric9: events.metric9,
  metric10: events.metric10,
} as const;

// SQLite strftime format per interval
const INTERVAL_FORMAT: Record<string, string> = {
  "1h":  "%Y-%m-%dT%H:00:00.000Z",
  "6h":  "%Y-%m-%dT",   // handled specially below
  "1d":  "%Y-%m-%d",
  "7d":  "%Y-W%W",
};

function timeBucket(interval: string) {
  if (interval === "6h") {
    // round down to nearest 6h block: 00, 06, 12, 18
    return sql`strftime('%Y-%m-%dT', occurred_at) ||
      CASE CAST(strftime('%H', occurred_at) AS INTEGER) / 6
        WHEN 0 THEN '00:00:00.000Z'
        WHEN 1 THEN '06:00:00.000Z'
        WHEN 2 THEN '12:00:00.000Z'
        ELSE        '18:00:00.000Z'
      END`;
  }
  return sql`strftime(${INTERVAL_FORMAT[interval]}, occurred_at)`;
}

function aggregateExpr(aggregate: string, metricCol?: keyof typeof METRIC_COL_MAP) {
  if (aggregate === "count") return sql<number>`count(*)`;
  const col = METRIC_COL_MAP[metricCol!];
  switch (aggregate) {
    case "sum": return sql<number>`sum(${col})`;
    case "avg": return sql<number>`avg(${col})`;
    case "min": return sql<number>`min(${col})`;
    case "max": return sql<number>`max(${col})`;
    default:    return sql<number>`count(*)`;
  }
}

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
  const parsed = TimeseriesQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const { interval, aggregate, metric_col, ...filters } = parsed.data;
  const where = buildEventConditions(datasetId, filters);
  const bucket = timeBucket(interval);
  const valueExpr = aggregateExpr(aggregate, metric_col);

  const rows = db
    .select({
      time: bucket,
      value: valueExpr,
    })
    .from(events)
    .where(where)
    .groupBy(bucket)
    .orderBy(bucket)
    .all();

  return ok({
    interval,
    aggregate,
    ...(metric_col ? { metric_col } : {}),
    datapoints: rows.map((r) => ({ time: r.time, value: r.value ?? 0 })),
  });
}
