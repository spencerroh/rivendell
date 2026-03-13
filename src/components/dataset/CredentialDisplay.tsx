"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Eye, EyeOff, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialItemProps {
  label: string;
  value: string;
  masked?: boolean;
}

function CredentialItem({ label, value, masked }: CredentialItemProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(!masked);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // fallback for non-HTTPS / old browsers
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 overflow-x-auto">
        <code className={cn("flex-1 text-sm font-mono whitespace-nowrap", !visible && "filter blur-sm select-none")}>
          {value}
        </code>
        {masked && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy}>
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}

interface CredentialDisplayProps {
  datasetId: string;
  ingestKey: string;
  adminKey: string;
}

export function CredentialDisplay({ datasetId, ingestKey, adminKey }: CredentialDisplayProps) {
  const [allCopied, setAllCopied] = useState(false);

  async function copyAll() {
    const text = `데이터셋 ID: ${datasetId}\n수집 키: ${ingestKey}\n관리자 키: ${adminKey}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <CredentialItem label="데이터셋 ID" value={datasetId} />
      <CredentialItem label="수집 키 (쓰기 전용)" value={ingestKey} masked />
      <CredentialItem label="관리자 키 (읽기 + 관리)" value={adminKey} masked />
      <div className="flex items-center justify-between">
        <p className="text-xs text-destructive">
          지금 바로 이 정보를 저장하세요. 키는 다시 표시되지 않습니다.
        </p>
        <Button size="sm" variant="outline" onClick={copyAll} className="shrink-0 ml-4">
          {allCopied ? (
            <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />복사됨</>
          ) : (
            <><ClipboardList className="h-3.5 w-3.5 mr-1.5" />전체 복사</>
          )}
        </Button>
      </div>
    </div>
  );
}
