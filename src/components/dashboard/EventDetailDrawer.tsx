"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EventRow, SchemaField } from "@/types";

interface EventDetailDrawerProps {
  event: EventRow | null;
  schemaFields: SchemaField[];
  open: boolean;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono break-all">{String(value)}</span>
    </div>
  );
}

export function EventDetailDrawer({ event, schemaFields, open, onClose }: EventDetailDrawerProps) {
  if (!event) return null;

  const dims = schemaFields.filter((f) => f.fieldType === "dim");
  const metrics = schemaFields.filter((f) => f.fieldType === "metric");

  let payloadObj: unknown = null;
  try {
    if (event.payloadJson) payloadObj = JSON.parse(event.payloadJson);
  } catch {
    payloadObj = event.payloadJson;
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm">{event.eventName}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)] mt-4 pr-2">
          <div className="space-y-4">
            {/* Common fields */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                공통 필드
              </p>
              <Field label="ID" value={event.id} />
              <Field label="occurred_at" value={event.occurredAt} />
              <Field label="received_at" value={event.receivedAt} />
              <Field label="actor_id" value={event.actorId} />
              <Field label="session_id" value={event.sessionId} />
              <Field label="source" value={event.source} />
              <Field label="status" value={event.status} />
            </div>

            {/* Dims */}
            {dims.some((f) => event[f.fieldKey as keyof EventRow] !== null) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    차원
                  </p>
                  {dims.map((f) => {
                    const val = event[f.fieldKey as keyof EventRow] as string | null;
                    if (!val) return null;
                    return <Field key={f.fieldKey} label={f.label || f.fieldKey} value={val} />;
                  })}
                </div>
              </>
            )}

            {/* Metrics */}
            {metrics.some((f) => event[f.fieldKey as keyof EventRow] !== null) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    지표
                  </p>
                  {metrics.map((f) => {
                    const val = event[f.fieldKey as keyof EventRow] as number | null;
                    if (val === null) return null;
                    return <Field key={f.fieldKey} label={f.label || f.fieldKey} value={val} />;
                  })}
                </div>
              </>
            )}

            {/* Payload */}
            {payloadObj !== null && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    페이로드 JSON
                  </p>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(payloadObj, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
