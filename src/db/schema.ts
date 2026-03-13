import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

// ─── datasets ──────────────────────────────────────────────────────
export const datasets = sqliteTable("datasets", {
  id: text("id").primaryKey(), // ds_<ulid>
  name: text("name").notNull(),
  description: text("description"),
  archivedAt: text("archived_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── api_keys ──────────────────────────────────────────────────────
export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    datasetId: text("dataset_id")
      .notNull()
      .references(() => datasets.id),
    keyType: text("key_type", { enum: ["ingest", "admin"] }).notNull(),
    keyPrefix: text("key_prefix").notNull(), // 앞 12자 표시용
    keyHash: text("key_hash").notNull(), // HMAC-SHA256
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_api_keys_dataset_type").on(
      t.datasetId,
      t.keyType,
      t.revokedAt
    ),
  ]
);

// ─── dataset_schema_fields ─────────────────────────────────────────
export const datasetSchemaFields = sqliteTable("dataset_schema_fields", {
  id: text("id").primaryKey(),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => datasets.id),
  fieldKey: text("field_key").notNull(), // dim1~dim10, metric1~metric3
  label: text("label").notNull(),
  fieldType: text("field_type", { enum: ["dim", "metric"] }).notNull(),
  visible: integer("visible").notNull().default(1), // 0/1
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── events ────────────────────────────────────────────────────────
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    datasetId: text("dataset_id")
      .notNull()
      .references(() => datasets.id),
    eventName: text("event_name").notNull(),
    actorId: text("actor_id"),
    sessionId: text("session_id"),
    source: text("source"),
    status: text("status"),
    occurredAt: text("occurred_at").notNull(),
    receivedAt: text("received_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    dim1: text("dim1"),
    dim2: text("dim2"),
    dim3: text("dim3"),
    dim4: text("dim4"),
    dim5: text("dim5"),
    dim6: text("dim6"),
    dim7: text("dim7"),
    dim8: text("dim8"),
    dim9: text("dim9"),
    dim10: text("dim10"),
    metric1: real("metric1"),
    metric2: real("metric2"),
    metric3: real("metric3"),
    payloadJson: text("payload_json"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_events_dataset_occurred").on(t.datasetId, t.occurredAt),
    index("idx_events_dataset_event_name").on(
      t.datasetId,
      t.eventName,
      t.occurredAt
    ),
    index("idx_events_dataset_actor").on(t.datasetId, t.actorId, t.occurredAt),
    index("idx_events_dataset_status").on(t.datasetId, t.status, t.occurredAt),
  ]
);

// ─── dataset_access_logs ───────────────────────────────────────────
export const datasetAccessLogs = sqliteTable(
  "dataset_access_logs",
  {
    id: text("id").primaryKey(),
    datasetId: text("dataset_id")
      .notNull()
      .references(() => datasets.id),
    action: text("action", {
      enum: [
        "view",
        "export_json",
        "export_xlsx",
        "rotate_key",
        "update_schema",
      ],
    }).notNull(),
    keyType: text("key_type"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_access_logs_dataset_action").on(
      t.datasetId,
      t.action,
      t.createdAt
    ),
  ]
);
