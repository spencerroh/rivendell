import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { sql } from "drizzle-orm";
import { extractBearerToken } from "@/lib/auth/keys";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import { isNoSecureMode } from "@/lib/auth/noSecureMode";
import { SummaryQuerySchema } from "@/lib/validation/metricsSchemas";
import { buildEventConditions } from "@/lib/query/buildEventConditions";
import { ok, err } from "@/lib/utils/response";

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
  const parsed = SummaryQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Validation failed", 400);
  }

  const where = buildEventConditions(datasetId, parsed.data);

  const row = db
    .select({
      total_events: sql<number>`count(*)`,
      unique_actors: sql<number>`count(distinct ${events.actorId})`,
      unique_sessions: sql<number>`count(distinct ${events.sessionId})`,
      first_event_at: sql<string | null>`min(${events.occurredAt})`,
      last_event_at: sql<string | null>`max(${events.occurredAt})`,
    })
    .from(events)
    .where(where)
    .get();

  return ok({
    total_events: row?.total_events ?? 0,
    unique_actors: row?.unique_actors ?? 0,
    unique_sessions: row?.unique_sessions ?? 0,
    first_event_at: row?.first_event_at ?? null,
    last_event_at: row?.last_event_at ?? null,
  });
}
