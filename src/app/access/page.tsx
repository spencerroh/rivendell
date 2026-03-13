import { HeaderWithSession as Header } from "@/components/layout/HeaderWithSession";
import { AccessForm } from "@/components/dataset/AccessForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessPage() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-4xl mx-auto w-full px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>데이터셋 열기</CardTitle>
              <CardDescription>
                dataset_id와 admin_key를 입력하여 대시보드에 접속하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessForm />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
