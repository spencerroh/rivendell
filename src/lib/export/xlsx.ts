import * as XLSX from "xlsx";
import type { EventRow, SchemaField } from "@/types";
import { buildHeaders, buildRow } from "./buildRows";

export function buildXlsxBuffer(
  eventRows: EventRow[],
  schemaFields: SchemaField[],
  options: { visibleOnly: boolean; includePayload: boolean }
): Buffer {
  const headers = buildHeaders(schemaFields, options);
  const rows = eventRows.map((e) => buildRow(e, schemaFields, options));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Events");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
