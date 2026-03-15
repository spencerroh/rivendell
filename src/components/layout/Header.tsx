import Link from "next/link";
import type { ReactNode } from "react";

interface HeaderProps {
  datasetId?: string;
  adminKey?: string;
  rightSlot?: ReactNode;
}

export function Header({ datasetId, adminKey, rightSlot }: HeaderProps) {
  return (
    <header className="border-b bg-white shrink-0">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">R</span>
          </div>
          <span className="font-semibold text-foreground">Rivendell</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/datasets/new" className="hover:text-foreground transition-colors">
            새 데이터셋
          </Link>
          <Link href="/access" className="hover:text-foreground transition-colors">
            데이터셋 열기
          </Link>
          {datasetId && (
            <Link
              href={`/datasets/${datasetId}`}
              className="hover:text-foreground transition-colors"
            >
              대시보드
            </Link>
          )}
          {datasetId && adminKey && (
            <Link
              href={`/datasets/${datasetId}/settings?key=${encodeURIComponent(adminKey)}`}
              className="hover:text-foreground transition-colors"
            >
              설정
            </Link>
          )}
          <Link href="/help" className="hover:text-foreground transition-colors">
            도움말
          </Link>
          <Link href="/admin" className="hover:text-foreground transition-colors">
            관리자
          </Link>
          {rightSlot}
        </nav>
      </div>
    </header>
  );
}
