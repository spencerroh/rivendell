import type { EventRow, SchemaField } from "@/types";

const FIXED_COLUMNS = [
  "occurred_at",
  "event_name",
  "actor_id",
  "session_id",
  "source",
  "status",
] as const;

export function buildHeaders(
  schemaFields: SchemaField[],
  options: { visibleOnly: boolean; includePayload: boolean }
): string[] {
  const headers: string[] = [...FIXED_COLUMNS];

  const dims = schemaFields.filter(
    (f) => f.fieldType === "dim" && (!options.visibleOnly || f.visible === 1)
  );
  const metrics = schemaFields.filter(
    (f) => f.fieldType === "metric" && (!options.visibleOnly || f.visible === 1)
  );

  dims.forEach((f) => headers.push(f.label || f.fieldKey));
  metrics.forEach((f) => headers.push(f.label || f.fieldKey));

  if (options.includePayload) headers.push("payload_json");
  headers.push("received_at");

  return headers;
}

export function buildRow(
  event: EventRow,
  schemaFields: SchemaField[],
  options: { visibleOnly: boolean; includePayload: boolean }
): (string | number | null)[] {
  const row: (string | number | null)[] = [
    event.occurredAt,
    event.eventName,
    event.actorId,
    event.sessionId,
    event.source,
    event.status,
  ];

  const dims = schemaFields.filter(
    (f) => f.fieldType === "dim" && (!options.visibleOnly || f.visible === 1)
  );
  const metrics = schemaFields.filter(
    (f) => f.fieldType === "metric" && (!options.visibleOnly || f.visible === 1)
  );

  dims.forEach((f) => {
    const key = f.fieldKey as keyof EventRow;
    row.push((event[key] as string | null) ?? null);
  });

  metrics.forEach((f) => {
    const key = f.fieldKey as keyof EventRow;
    row.push((event[key] as number | null) ?? null);
  });

  if (options.includePayload) row.push(event.payloadJson);
  row.push(event.receivedAt);

  return row;
}
