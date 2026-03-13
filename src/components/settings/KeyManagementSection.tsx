"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { ApiKeyInfo } from "@/types";

interface KeyManagementSectionProps {
  datasetId: string;
  adminKey: string;
  keys: ApiKeyInfo[];
}

export function KeyManagementSection({ datasetId, adminKey, keys: initialKeys }: KeyManagementSectionProps) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>(initialKeys);
  const [rotating, setRotating] = useState<"ingest" | "admin" | null>(null);
  const [newKey, setNewKey] = useState<{ key_type: string; new_key: string; key_prefix: string } | null>(null);
  const [confirmType, setConfirmType] = useState<"ingest" | "admin" | null>(null);

  async function rotateKey(keyType: "ingest" | "admin") {
    setRotating(keyType);
    try {
      const res = await fetch(`/api/v1/datasets/${datasetId}/keys/rotate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key_type: keyType }),
      });

      if (res.ok) {
        const json = await res.json();
        setNewKey(json.data);
        setKeys((prev) =>
          prev.map((k) =>
            k.keyType === keyType
              ? { ...k, keyPrefix: json.data.key_prefix ?? k.keyPrefix, lastUsedAt: null }
              : k
          )
        );
      }
    } finally {
      setRotating(null);
      setConfirmType(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>키 관리</CardTitle>
          <CardDescription>
            키를 교체하면 기존 키가 즉시 폐기되고 새 키가 발급됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {keys.map((key) => (
            <div key={key.keyType} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={key.keyType === "admin" ? "default" : "secondary"}>
                    {key.keyType === "admin" ? "관리" : "수집"}
                  </Badge>
                  <code className="text-sm font-mono">{key.keyPrefix}...</code>
                </div>
                <p className="text-xs text-muted-foreground">
                  마지막 사용:{" "}
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleString()
                    : "없음"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmType(key.keyType as "ingest" | "admin")}
                disabled={rotating === key.keyType}
              >
                {rotating === key.keyType ? "교체 중..." : "키 교체"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={!!confirmType} onOpenChange={(o) => !o && setConfirmType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmType === "admin" ? "관리" : "수집"} 키를 교체할까요?</DialogTitle>
            <DialogDescription>
              현재 키가 즉시 폐기됩니다. 이 키를 사용하는 모든 시스템을 업데이트하세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmType(null)}>취소</Button>
            <Button variant="destructive" onClick={() => confirmType && rotateKey(confirmType)}>
              교체
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New key display */}
      <Dialog open={!!newKey} onOpenChange={(o) => !o && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 키 발급 완료</DialogTitle>
            <DialogDescription>
              지금 바로 이 키를 저장하세요 — 다시 표시되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-muted rounded-md p-3 text-sm font-mono whitespace-nowrap overflow-x-auto w-full min-w-0 max-w-full">
            {newKey?.new_key}
          </pre>
          <DialogFooter>
            <Button onClick={() => {
              if (newKey) navigator.clipboard.writeText(newKey.new_key);
            }} variant="outline">복사</Button>
            <Button onClick={() => setNewKey(null)}>완료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
