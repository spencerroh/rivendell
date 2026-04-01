import { HeaderWithSession as Header } from "@/components/layout/HeaderWithSession";
import { AccessForm } from "@/components/dataset/AccessForm";
import { DatasetListView } from "@/components/dataset/DatasetListView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isNoSecureMode } from "@/lib/auth/noSecureMode";
import { db } from "@/db/client";
import { datasets } from "@/db/schema";
import { isNull } from "drizzle-orm";

export default function AccessPage() {
  const noSecure = isNoSecureMode();
  const allDatasets = noSecure
    ? db.select().from(datasets).where(isNull(datasets.archivedAt)).all()
    : [];

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-4xl mx-auto w-full px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>데이터셋 열기</CardTitle>
              <CardDescription>
                {noSecure
                  ? "데이터셋을 선택하여 대시보드에 접속하세요."
                  : "dataset_id와 admin_key를 입력하여 대시보드에 접속하세요."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {noSecure ? (
                <DatasetListView datasets={allDatasets} />
              ) : (
                <AccessForm />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
