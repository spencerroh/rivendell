import { z } from "zod";

// ─── Dataset ───────────────────────────────────────────────────────
export const CreateDatasetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  dims: z
    .array(z.object({ key: z.string(), label: z.string().max(50) }))
    .max(10)
    .optional(),
  metrics: z
    .array(z.object({ key: z.string(), label: z.string().max(50) }))
    .max(3)
    .optional(),
});

export const UpdateSchemaSchema = z.object({
  dims: z
    .array(
      z.object({
        key: z.string(),
        label: z.string().max(50),
        visible: z.boolean(),
      })
    )
    .max(10)
    .optional(),
  metrics: z
    .array(
      z.object({
        key: z.string(),
        label: z.string().max(50),
        visible: z.boolean(),
      })
    )
    .max(3)
    .optional(),
});

// ─── Ingest ────────────────────────────────────────────────────────
export const IngestEventSchema = z.object({
  event_name: z.string().min(1).max(200),
  actor_id: z.string().max(200).optional(),
  session_id: z.string().max(200).optional(),
  source: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  occurred_at: z.string().optional(), // ISO 8601 datetime, validated in API route
  dim1: z.string().max(500).optional(),
  dim2: z.string().max(500).optional(),
  dim3: z.string().max(500).optional(),
  dim4: z.string().max(500).optional(),
  dim5: z.string().max(500).optional(),
  dim6: z.string().max(500).optional(),
  dim7: z.string().max(500).optional(),
  dim8: z.string().max(500).optional(),
  dim9: z.string().max(500).optional(),
  dim10: z.string().max(500).optional(),
  metric1: z.number().optional(),
  metric2: z.number().optional(),
  metric3: z.number().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const IngestBatchSchema = z.object({
  dataset_id: z.string(),
  events: z.array(IngestEventSchema).min(1).max(500),
});

// ─── Events Query ──────────────────────────────────────────────────
export const EventsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  event_name: z.string().optional(),
  actor_id: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  dim_col: z.enum(["dim1","dim2","dim3","dim4","dim5","dim6","dim7","dim8","dim9","dim10"]).optional(),
  dim_val: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
});

export const ExportQuerySchema = EventsQuerySchema.omit({
  page: true,
  page_size: true,
}).extend({
  visible_only: z.coerce.boolean().default(true),
  include_payload: z.coerce.boolean().default(false),
});
