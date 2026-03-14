import { events } from "@/db/schema";
import { eq, and, gte, lte, gt, lt, like, isNull, between, SQL } from "drizzle-orm";

const DIM_MAP = {
  dim1: events.dim1, dim2: events.dim2, dim3: events.dim3,
  dim4: events.dim4, dim5: events.dim5, dim6: events.dim6,
  dim7: events.dim7, dim8: events.dim8, dim9: events.dim9,
  dim10: events.dim10,
} as const;

const METRIC_MAP = {
  metric1: events.metric1, metric2: events.metric2, metric3: events.metric3,
  metric4: events.metric4, metric5: events.metric5, metric6: events.metric6,
  metric7: events.metric7, metric8: events.metric8, metric9: events.metric9,
  metric10: events.metric10,
} as const;

interface BaseEventFilter {
  from?: string;
  to?: string;
  event_name?: string;
  actor_id?: string;
  source?: string;
  status?: string;
  dim_col?: keyof typeof DIM_MAP;
  dim_val?: string;
  metric_col?: keyof typeof METRIC_MAP;
  metric_op?: "eq" | "lt" | "gt" | "lte" | "gte" | "between" | "null";
  metric_val1?: number;
  metric_val2?: number;
}

export function buildEventConditions(datasetId: string, q: BaseEventFilter): SQL {
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

  if (q.metric_col && q.metric_op) {
    const col = METRIC_MAP[q.metric_col];
    if (q.metric_op === "null") {
      conditions.push(isNull(col));
    } else if (q.metric_val1 !== undefined) {
      switch (q.metric_op) {
        case "eq": conditions.push(eq(col, q.metric_val1)); break;
        case "lt": conditions.push(lt(col, q.metric_val1)); break;
        case "gt": conditions.push(gt(col, q.metric_val1)); break;
        case "lte": conditions.push(lte(col, q.metric_val1)); break;
        case "gte": conditions.push(gte(col, q.metric_val1)); break;
        case "between":
          if (q.metric_val2 !== undefined) conditions.push(between(col, q.metric_val1, q.metric_val2));
          break;
      }
    }
  }

  return (conditions.length === 1 ? conditions[0] : and(...conditions)) as SQL;
}
