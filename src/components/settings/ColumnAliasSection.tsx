"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SchemaField } from "@/types";

const ALL_DIM_KEYS = ["dim1","dim2","dim3","dim4","dim5","dim6","dim7","dim8","dim9","dim10"];
const ALL_METRIC_KEYS = ["metric1","metric2","metric3"];

function buildMergedFields(existing: SchemaField[]): SchemaField[] {
  const map = new Map(existing.map((f) => [f.fieldKey, f]));
  return [
    ...ALL_DIM_KEYS.map((key, i) =>
      map.get(key) ?? { id: "", datasetId: "", fieldKey: key, label: "", fieldType: "dim" as const, visible: 1, sortOrder: i }
    ),
    ...ALL_METRIC_KEYS.map((key, i) =>
      map.get(key) ?? { id: "", datasetId: "", fieldKey: key, label: "", fieldType: "metric" as const, visible: 1, sortOrder: i }
    ),
  ];
}

interface ColumnAliasSectionProps {
  datasetId: string;
  adminKey: string;
  schemaFields: SchemaField[];
}

export function ColumnAliasSection({ datasetId, adminKey, schemaFields }: ColumnAliasSectionProps) {
  const [fields, setFields] = useState<SchemaField[]>(() => buildMergedFields(schemaFields));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateLabel(fieldKey: string, label: string) {
    setFields((prev) =>
      prev.map((f) => (f.fieldKey === fieldKey ? { ...f, label } : f))
    );
  }

  function toggleVisible(fieldKey: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.fieldKey === fieldKey ? { ...f, visible: f.visible === 1 ? 0 : 1 } : f
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const dims = fields
        .filter((f) => f.fieldType === "dim")
        .map((f) => ({ key: f.fieldKey, label: f.label, visible: f.visible === 1 }));
      const metrics = fields
        .filter((f) => f.fieldType === "metric")
        .map((f) => ({ key: f.fieldKey, label: f.label, visible: f.visible === 1 }));

      const res = await fetch(`/api/v1/datasets/${datasetId}/schema`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dims, metrics }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  const dims = fields.filter((f) => f.fieldType === "dim");
  const metrics = fields.filter((f) => f.fieldType === "metric");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>컬럼 별칭</CardTitle>
          <CardDescription className="mt-1">
            대시보드와 내보내기에서 사용할 dim1~dim10, metric1~metric3 컬럼의 이름을 설정하세요.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="shrink-0">
          {saved ? "저장됨!" : saving ? "저장 중..." : "변경사항 저장"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 문자열 컬럼 */}
        <div className="space-y-3">
          <p className="text-sm font-medium">문자열 컬럼 (dim)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {dims.map((f) => (
              <div key={f.fieldKey} className="flex items-center gap-2">
                <code className="text-xs w-14 text-muted-foreground shrink-0">{f.fieldKey}</code>
                <Input
                  value={f.label}
                  onChange={(e) => updateLabel(f.fieldKey, e.target.value)}
                  placeholder={f.fieldKey}
                  className="flex-1 h-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleVisible(f.fieldKey)}
                  className={`text-xs px-2 py-1 rounded border shrink-0 ${
                    f.visible === 1
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {f.visible === 1 ? "표시" : "숨김"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 숫자 컬럼 */}
        <div className="space-y-3">
          <p className="text-sm font-medium">숫자 컬럼 (metric)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {metrics.map((f) => (
              <div key={f.fieldKey} className="flex items-center gap-2">
                <code className="text-xs w-14 text-muted-foreground shrink-0">{f.fieldKey}</code>
                <Input
                  value={f.label}
                  onChange={(e) => updateLabel(f.fieldKey, e.target.value)}
                  placeholder={f.fieldKey}
                  className="flex-1 h-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => toggleVisible(f.fieldKey)}
                  className={`text-xs px-2 py-1 rounded border shrink-0 ${
                    f.visible === 1
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {f.visible === 1 ? "표시" : "숨김"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
