"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { CredentialDisplay } from "@/components/dataset/CredentialDisplay";
import { QuickStartTabs } from "@/components/dataset/QuickStartTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";

interface DatasetCredentials {
  dataset_id: string;
  ingest_key: string;
  admin_key: string;
  name: string;
}

export default function CreateSuccessPage() {
  const router = useRouter();
  const [creds, setCreds] = useState<DatasetCredentials | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    // StrictMode 이중 실행 방지
    if (fetched.current) return;
    fetched.current = true;

    const raw = sessionStorage.getItem("rivendell_new_dataset");
    if (!raw) {
      router.replace("/datasets/new");
      return;
    }
    const parsed = JSON.parse(raw) as DatasetCredentials;
    setCreds(parsed);
    // 보안: 읽은 후 삭제
    sessionStorage.removeItem("rivendell_new_dataset");
  }, [router]);

  if (!creds) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <CheckCircle className="text-green-500 h-7 w-7" />
          <div>
            <h1 className="text-2xl font-bold">데이터셋 생성 완료!</h1>
            <p className="text-muted-foreground text-sm">{creds.name}</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">발급된 자격 증명</CardTitle>
            <CardDescription>
              지금 저장하세요 — 키는 다시 표시되지 않습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CredentialDisplay
              datasetId={creds.dataset_id}
              ingestKey={creds.ingest_key}
              adminKey={creds.admin_key}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">빠른 시작</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickStartTabs datasetId={creds.dataset_id} ingestKey={creds.ingest_key} />
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/datasets/${creds.dataset_id}?key=${encodeURIComponent(creds.admin_key)}`}>대시보드로 이동</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/datasets/new">새로 만들기</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
