import { z } from "zod";

const METRIC_COLS = ["metric1","metric2","metric3","metric4","metric5","metric6","metric7","metric8","metric9","metric10"] as const;
const GROUP_BY_COLS = ["event_name","status","source","actor_id","dim1","dim2","dim3","dim4","dim5","dim6","dim7","dim8","dim9","dim10"] as const;

const BaseFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  event_name: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
});

export const TimeseriesQuerySchema = BaseFilterSchema.extend({
  interval: z.enum(["1h", "6h", "1d", "7d"]).default("1d"),
  aggregate: z.enum(["count", "sum", "avg", "min", "max"]).default("count"),
  metric_col: z.enum(METRIC_COLS).optional(),
}).refine(
  (d) => d.aggregate === "count" || d.metric_col !== undefined,
  { message: "metric_col is required when aggregate is not 'count'" }
);

export const BreakdownQuerySchema = BaseFilterSchema.extend({
  group_by: z.enum(GROUP_BY_COLS),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SummaryQuerySchema = BaseFilterSchema;
