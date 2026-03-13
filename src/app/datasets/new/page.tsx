import { HeaderWithSession as Header } from "@/components/layout/HeaderWithSession";
import { CreateDatasetForm } from "@/components/dataset/CreateDatasetForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateDatasetPage() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-4xl mx-auto w-full px-6 py-16">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>새 데이터셋 만들기</CardTitle>
              <CardDescription>
                dataset_id와 API 키가 즉시 생성됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateDatasetForm />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
