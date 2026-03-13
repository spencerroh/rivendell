"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { EventFilters } from "@/types";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  datasetId: string;
  adminKey: string;
  currentFilters: EventFilters;
}

export function ExportModal({
  open,
  onClose,
  datasetId,
  adminKey,
  currentFilters,
}: ExportModalProps) {
  const [format, setFormat] = useState<"json" | "xlsx">("xlsx");
  const [includePayload, setIncludePayload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (currentFilters.from) params.set("from", currentFilters.from);
    if (currentFilters.to) params.set("to", currentFilters.to);
    if (currentFilters.event_name) params.set("event_name", currentFilters.event_name);
    if (currentFilters.actor_id) params.set("actor_id", currentFilters.actor_id);
    if (currentFilters.source) params.set("source", currentFilters.source);
    if (currentFilters.status) params.set("status", currentFilters.status);
    if (currentFilters.dim_col) params.set("dim_col", currentFilters.dim_col);
    if (currentFilters.dim_val) params.set("dim_val", currentFilters.dim_val);
    params.set("include_payload", String(includePayload));

    try {
      const res = await fetch(
        `/api/v1/datasets/${datasetId}/export.${format}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${adminKey}` } }
      );

      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? "내보내기에 실패했습니다");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `result.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이벤트 내보내기</DialogTitle>
          <DialogDescription>
            현재 필터 설정을 기준으로 내보냅니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>형식</Label>
            <div className="flex gap-3">
              {(["xlsx", "json"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={format === f ? "default" : "outline"}
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includePayload"
              checked={includePayload}
              onChange={(e) => setIncludePayload(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="includePayload" className="cursor-pointer">
              payload_json 컬럼 포함
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? "내보내는 중..." : `${format.toUpperCase()} 다운로드`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
