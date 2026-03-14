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

const METRIC_OPS = [
  { value: "eq", label: "같음 (=)" },
  { value: "lt", label: "작음 (<)" },
  { value: "gt", label: "큼 (>)" },
  { value: "lte", label: "같거나 작음 (≤)" },
  { value: "gte", label: "같거나 큼 (≥)" },
  { value: "between", label: "사이 (between)" },
  { value: "null", label: "없음 (null)" },
] as const;

type ColFilterType = "none" | "dim" | "metric";

interface FilterBarProps {
  filters: EventFilters;
  onApply: (filters: EventFilters) => void;
  onReset: () => void;
  schemaFields: SchemaField[];
}

function detectColFilterType(f: EventFilters): ColFilterType {
  if (f.dim_col) return "dim";
  if (f.metric_col) return "metric";
  return "none";
}

export function FilterBar({ filters, onApply, onReset, schemaFields }: FilterBarProps) {
  const [local, setLocal] = useState<EventFilters>(filters);
  const [colFilterType, setColFilterType] = useState<ColFilterType>(
    detectColFilterType(filters)
  );

  const dimFields = schemaFields.filter((f) => f.fieldType === "dim");
  const metricFields = schemaFields.filter((f) => f.fieldType === "metric");

  function update(key: keyof EventFilters, value: string) {
    setLocal((prev) => ({ ...prev, [key]: value || undefined }));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onApply(local);
  }

  function switchColFilterType(type: ColFilterType) {
    setColFilterType(type);
    setLocal((prev) => ({
      ...prev,
      dim_col: undefined,
      dim_val: undefined,
      metric_col: undefined,
      metric_op: undefined,
      metric_val1: undefined,
      metric_val2: undefined,
    }));
  }

  const showValInput = local.metric_op && local.metric_op !== "null";
  const showVal2 = local.metric_op === "between";

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

      {/* 텍스트 필터 행 */}
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
      </div>

      {/* 컬럼 필터 행 */}
      <div className="flex gap-2 items-end flex-wrap">
        {/* dim / metric 토글 */}
        <div className="flex flex-col gap-1 shrink-0">
          <label className="text-xs text-muted-foreground">컬럼 필터</label>
          <div className="flex h-8 rounded-md border border-border overflow-hidden text-xs">
            {(["none", "dim", "metric"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => switchColFilterType(type)}
                className={`px-3 h-full transition-colors ${
                  colFilterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                } ${type !== "none" ? "border-l border-border" : ""}`}
              >
                {type === "none" ? "없음" : type}
              </button>
            ))}
          </div>
        </div>

        {/* dim 필드 */}
        {colFilterType === "dim" && (
          <>
            <div className="flex flex-col gap-1 w-37.5 shrink-0">
              <label className="text-xs text-muted-foreground">컬럼</label>
              <Select
                value={local.dim_col ?? ""}
                onValueChange={(v) =>
                  setLocal((prev) => ({ ...prev, dim_col: v || undefined }))
                }
                disabled={dimFields.length === 0}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue
                    placeholder={dimFields.length === 0 ? "없음" : "선택"}
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
            <div className="flex flex-col gap-1 flex-1 min-w-30">
              <label className="text-xs text-muted-foreground">검색값 (포함)</label>
              <Input
                placeholder="검색어"
                value={local.dim_val ?? ""}
                onChange={(e) => update("dim_val", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!local.dim_col}
                className="h-8 text-sm"
              />
            </div>
          </>
        )}

        {/* metric 필드 */}
        {colFilterType === "metric" && (
          <>
            <div className="flex flex-col gap-1 w-37.5 shrink-0">
              <label className="text-xs text-muted-foreground">컬럼</label>
              <Select
                value={local.metric_col ?? ""}
                onValueChange={(v) =>
                  setLocal((prev) => ({
                    ...prev,
                    metric_col: v || undefined,
                    metric_op: undefined,
                    metric_val1: undefined,
                    metric_val2: undefined,
                  }))
                }
                disabled={metricFields.length === 0}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue
                    placeholder={metricFields.length === 0 ? "없음" : "선택"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {metricFields.map((f) => (
                    <SelectItem key={f.fieldKey} value={f.fieldKey}>
                      {f.label || f.fieldKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 w-40 shrink-0">
              <label className="text-xs text-muted-foreground">연산자</label>
              <Select
                value={local.metric_op ?? ""}
                onValueChange={(v) =>
                  setLocal((prev) => ({
                    ...prev,
                    metric_op: v || undefined,
                    metric_val1: undefined,
                    metric_val2: undefined,
                  }))
                }
                disabled={!local.metric_col}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showValInput && (
              <div className="flex flex-col gap-1 w-27.5 shrink-0">
                <label className="text-xs text-muted-foreground">
                  값{showVal2 ? " (시작)" : ""}
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={local.metric_val1 ?? ""}
                  onChange={(e) => update("metric_val1", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm"
                />
              </div>
            )}
            {showVal2 && (
              <div className="flex flex-col gap-1 w-27.5 shrink-0">
                <label className="text-xs text-muted-foreground">값 (끝)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={local.metric_val2 ?? ""}
                  onChange={(e) => update("metric_val2", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 pb-0.5 shrink-0 ml-auto">
          <Button size="sm" onClick={() => onApply(local)}>
            적용
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLocal({});
              setColFilterType("none");
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
