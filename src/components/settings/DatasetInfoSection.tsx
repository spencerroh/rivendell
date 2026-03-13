"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface DatasetInfoSectionProps {
  datasetId: string;
  adminKey: string;
  name: string;
  description: string | null;
}

export function DatasetInfoSection({
  datasetId,
  adminKey,
  name,
  description,
}: DatasetInfoSectionProps) {
  const router = useRouter();
  const [localName, setLocalName] = useState(name);
  const [localDescription, setLocalDescription] = useState(description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = localName !== name || localDescription !== (description ?? "");

  async function handleSave() {
    if (!localName.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/datasets/${datasetId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: localName.trim(),
          description: localDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? "변경사항 저장에 실패했습니다");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>데이터셋 정보</CardTitle>
          <CardDescription className="mt-1">
            데이터셋의 이름과 설명을 수정하세요.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty || !localName.trim()}
          className="shrink-0"
        >
          {saved ? "저장됨!" : saving ? "저장 중..." : "변경사항 저장"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="dataset-name">이름</Label>
          <Input
            id="dataset-name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dataset-description">설명</Label>
          <Textarea
            id="dataset-description"
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="resize-none"
            placeholder="선택 사항"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
