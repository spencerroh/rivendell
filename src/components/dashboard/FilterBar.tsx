"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventFilters, SchemaField } from "@/types";

interface FilterBarProps {
  filters: EventFilters;
  onApply: (filters: EventFilters) => void;
  onReset: () => void;
  schemaFields: SchemaField[];
}

export function FilterBar({ filters, onApply, onReset, schemaFields }: FilterBarProps) {
  const [local, setLocal] = useState<EventFilters>(filters);

  const dimFields = schemaFields.filter((f) => f.fieldType === "dim");

  function update(key: keyof EventFilters, value: string) {
    setLocal((prev) => ({ ...prev, [key]: value || undefined }));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onApply(local);
  }

  return (
    <div className="space-y-2">
      {/* 날짜 행 */}
      <div className="flex gap-2 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">시작일</label>
          <Input
            type="datetime-local"
            value={local.from ?? ""}
            onChange={(e) => update("from", e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">종료일</label>
          <Input
            type="datetime-local"
            value={local.to ?? ""}
            onChange={(e) => update("to", e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm w-[200px]"
          />
        </div>
      </div>

      {/* 텍스트 필터 + 버튼 한 줄 */}
      <div className="flex gap-2 items-end flex-nowrap">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-xs text-muted-foreground">이벤트명</label>
          <Input
            placeholder="page_view"
            value={local.event_name ?? ""}
            onChange={(e) => update("event_name", e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-xs text-muted-foreground">액터 ID</label>
          <Input
            placeholder="user_123"
            value={local.actor_id ?? ""}
            onChange={(e) => update("actor_id", e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-xs text-muted-foreground">소스</label>
          <Input
            placeholder="web"
            value={local.source ?? ""}
            onChange={(e) => update("source", e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-xs text-muted-foreground">상태</label>
          <Input
            placeholder="success"
            value={local.status ?? ""}
            onChange={(e) => update("status", e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 w-[140px] shrink-0">
          <label className="text-xs text-muted-foreground">dim 컬럼</label>
          <Select
            value={local.dim_col ?? ""}
            onValueChange={(v) =>
              setLocal((prev) => ({ ...prev, dim_col: v || undefined }))
            }
            disabled={dimFields.length === 0}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue
                placeholder={dimFields.length === 0 ? "dim 없음" : "컬럼 선택"}
              />
            </SelectTrigger>
            <SelectContent>
              {dimFields.map((f) => (
                <SelectItem key={f.fieldKey} value={f.fieldKey}>
                  {f.label || f.fieldKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <label className="text-xs text-muted-foreground">검색값</label>
          <Input
            placeholder="검색어"
            value={local.dim_val ?? ""}
            onChange={(e) => update("dim_val", e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!local.dim_col}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-2 pb-0.5 shrink-0">
          <Button size="sm" onClick={() => onApply(local)}>
            적용
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLocal({});
              onReset();
            }}
          >
            초기화
          </Button>
        </div>
      </div>
    </div>
  );
}
