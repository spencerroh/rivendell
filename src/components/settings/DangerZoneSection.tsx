"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DangerZoneSectionProps {
  datasetId: string;
  adminKey: string;
}

export function DangerZoneSection({ datasetId, adminKey }: DangerZoneSectionProps) {
  const router = useRouter();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openArchive() {
    setConfirmInput("");
    setError(null);
    setArchiveDialogOpen(true);
  }

  function openDelete() {
    setConfirmInput("");
    setError(null);
    setDeleteDialogOpen(true);
  }

  async function handleArchive() {
    if (confirmInput !== datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/datasets/${datasetId}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? "아카이브에 실패했습니다.");
        return;
      }
      setArchiveDialogOpen(false);
      router.push(`/api/auth/logout?datasetId=${encodeURIComponent(datasetId)}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvents() {
    if (confirmInput !== datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/datasets/${datasetId}/events`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? "삭제에 실패했습니다.");
        return;
      }
      setDeleteDialogOpen(false);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">위험 구역</CardTitle>
          <CardDescription>이 작업은 되돌릴 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-red-50/60 p-4">
            <div>
              <p className="text-sm font-medium text-destructive">데이터셋 아카이브</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                데이터셋을 아카이브 상태로 변경합니다. 이후 새 이벤트를 수집하지 않습니다.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 ml-4 border-destructive/50 text-destructive hover:bg-destructive/5"
              onClick={openArchive}
            >
              아카이브
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-red-50/60 p-4">
            <div>
              <p className="text-sm font-medium text-destructive">모든 이벤트 삭제</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                이 데이터셋의 모든 이벤트 데이터를 영구 삭제합니다. 스키마와 키는 유지됩니다.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 ml-4 border-destructive/50 text-destructive hover:bg-destructive/5"
              onClick={openDelete}
            >
              모든 데이터 삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archive Confirm Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={(o) => { if (!loading) { setArchiveDialogOpen(o); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데이터셋 아카이브</DialogTitle>
            <DialogDescription>
              아카이브 후에는 새 이벤트를 수집할 수 없습니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              확인을 위해 데이터셋 ID를 입력해주세요:
            </p>
            <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{datasetId}</p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={datasetId}
              className="font-mono text-sm"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)} disabled={loading}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={confirmInput !== datasetId || loading}
            >
              {loading ? "처리 중..." : "아카이브"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Events Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(o) => { if (!loading) { setDeleteDialogOpen(o); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모든 이벤트 삭제</DialogTitle>
            <DialogDescription>
              모든 이벤트 데이터가 영구 삭제됩니다. 스키마와 API 키는 유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              확인을 위해 데이터셋 ID를 입력해주세요:
            </p>
            <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{datasetId}</p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={datasetId}
              className="font-mono text-sm"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvents}
              disabled={confirmInput !== datasetId || loading}
            >
              {loading ? "삭제 중..." : "모든 데이터 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
