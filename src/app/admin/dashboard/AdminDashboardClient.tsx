"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AdminDatasetRow, AdminSummary } from "@/lib/admin/queries";

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

interface Props {
  summary: AdminSummary;
  datasets: AdminDatasetRow[];
}

export function AdminDashboardClient({ summary, datasets }: Props) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<AdminDatasetRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/datasets/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        const data = await res.json();
        setDeleteError(data?.error?.message ?? "삭제에 실패했습니다.");
      }
    } catch {
      setDeleteError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="전체 데이터셋" value={formatNumber(summary.totalDatasets)} />
        <SummaryCard label="전체 이벤트" value={formatNumber(summary.totalEvents)} />
      </div>

      {/* Dataset Table */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-sm text-foreground">데이터셋 목록</h2>
        </div>

        {datasets.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted-foreground text-sm">
            데이터셋이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    데이터셋
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    이벤트 수
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    마지막 이벤트
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{ds.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{ds.id}</div>
                      {ds.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                          {ds.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-foreground">
                      {formatNumber(ds.eventCount ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatRelativeTime(ds.lastEventAt)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(ds.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(ds);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                        title="데이터셋 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>데이터셋 삭제</DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 해당 데이터셋의 모든 이벤트와 API 키가 영구 삭제됩니다.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1 border">
              <div className="font-medium">{deleteTarget.name}</div>
              <div className="text-muted-foreground font-mono text-xs">{deleteTarget.id}</div>
              <div className="text-destructive text-xs mt-1">
                이벤트 {formatNumber(deleteTarget.eventCount ?? 0)}개가 삭제됩니다.
              </div>
            </div>
          )}

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border px-5 py-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}
