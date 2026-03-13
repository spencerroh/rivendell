export interface SchemaField {
  id: string;
  datasetId: string;
  fieldKey: string;
  label: string;
  fieldType: "dim" | "metric";
  visible: number; // 0 | 1
  sortOrder: number;
}

export interface EventRow {
  id: string;
  datasetId: string;
  eventName: string;
  actorId: string | null;
  sessionId: string | null;
  source: string | null;
  status: string | null;
  occurredAt: string;
  receivedAt: string;
  dim1: string | null;
  dim2: string | null;
  dim3: string | null;
  dim4: string | null;
  dim5: string | null;
  dim6: string | null;
  dim7: string | null;
  dim8: string | null;
  dim9: string | null;
  dim10: string | null;
  metric1: number | null;
  metric2: number | null;
  metric3: number | null;
  payloadJson: string | null;
}

export interface DatasetInfo {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ApiKeyInfo {
  id: string;
  keyType: "ingest" | "admin";
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface EventFilters {
  from?: string;
  to?: string;
  event_name?: string;
  actor_id?: string;
  source?: string;
  status?: string;
  dim_col?: string;
  dim_val?: string;
}
