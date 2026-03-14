"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import type { EventRow, SchemaField } from "@/types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 100] as const;

interface EventTableProps {
  events: EventRow[];
  total: number;
  page: number;
  pageSize: number;
  schemaFields: SchemaField[];
  visibleColumns: string[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick: (event: EventRow) => void;
}

const FIXED_COLS = ["occurred_at", "event_name", "actor_id", "source", "status"] as const;

const FIXED_COL_LABELS: Record<typeof FIXED_COLS[number], string> = {
  occurred_at: "발생일시",
  event_name: "이벤트명",
  actor_id: "액터 ID",
  source: "소스",
  status: "상태",
};

function PayloadDialog({ json, open, onClose }: { json: string; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  let pretty = json;
  try {
    pretty = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    // use raw
  }

  function handleCopy() {
    navigator.clipboard.writeText(pretty).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payload</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-all">
            {pretty}
          </pre>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventTable({
  events,
  total,
  page,
  pageSize,
  schemaFields,
  visibleColumns,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: EventTableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const [payloadJson, setPayloadJson] = useState<string | null>(null);

  const visibleDims = schemaFields.filter(
    (f) => f.fieldType === "dim" && visibleColumns.includes(f.fieldKey)
  );
  const visibleMetrics = schemaFields.filter(
    (f) => f.fieldType === "metric" && visibleColumns.includes(f.fieldKey)
  );

  const colSpan = FIXED_COLS.length + visibleDims.length + visibleMetrics.length + 1;

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {FIXED_COLS.map((col) => (
                <TableHead key={col} className="whitespace-nowrap text-xs">
                  {FIXED_COL_LABELS[col]}
                </TableHead>
              ))}
              {visibleDims.map((f) => (
                <TableHead key={f.fieldKey} className="whitespace-nowrap text-xs">
                  {f.label || f.fieldKey}
                </TableHead>
              ))}
              {visibleMetrics.map((f) => (
                <TableHead key={f.fieldKey} className="whitespace-nowrap text-xs text-right">
                  {f.label || f.fieldKey}
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap text-xs text-center w-16">
                payload
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center text-muted-foreground py-12"
                >
                  이벤트가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick(event)}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(event.occurredAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {event.eventName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {event.actorId ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {event.source ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {event.status ? (
                      <Badge variant="outline" className="text-xs">
                        {event.status}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {visibleDims.map((f) => (
                    <TableCell key={f.fieldKey} className="text-xs">
                      {(event[f.fieldKey as keyof EventRow] as string) ?? "—"}
                    </TableCell>
                  ))}
                  {visibleMetrics.map((f) => (
                    <TableCell key={f.fieldKey} className="text-xs text-right">
                      {(event[f.fieldKey as keyof EventRow] as number | null) ?? "—"}
                    </TableCell>
                  ))}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {event.payloadJson ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setPayloadJson(event.payloadJson!)}
                      >
                        보기
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            {total === 0
              ? "검색 결과 없음"
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} / ${total.toLocaleString()}`}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-7 w-18 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n}개
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {payloadJson && (
        <PayloadDialog
          json={payloadJson}
          open={true}
          onClose={() => setPayloadJson(null)}
        />
      )}
    </div>
  );
}
