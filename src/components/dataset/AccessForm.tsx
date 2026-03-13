"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccessForm() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey }),
      });

      if (res.status === 401 || res.status === 404) {
        setError("유효하지 않은 관리자 키입니다. 확인 후 다시 시도해주세요.");
        return;
      }
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? "접근에 실패했습니다.");
        return;
      }

      const { datasetId } = await res.json();
      router.push(`/datasets/${datasetId}?key=${encodeURIComponent(adminKey)}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="adminKey">관리자 키</Label>
        <Input
          id="adminKey"
          type="password"
          placeholder="adm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading || !adminKey}>
        {loading ? "확인 중..." : "대시보드 열기"}
      </Button>
    </form>
  );
}
