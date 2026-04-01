import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface DatasetListViewProps {
  datasets: Dataset[];
}

export function DatasetListView({ datasets }: DatasetListViewProps) {
  if (datasets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">등록된 데이터셋이 없습니다.</p>
        <p className="text-sm mt-1">먼저 새 데이터셋을 만들어 주세요.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {datasets.map((ds) => (
        <Link key={ds.id} href={`/datasets/${ds.id}`}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">{ds.name}</CardTitle>
              {ds.description && (
                <CardDescription>{ds.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {ds.id} · 생성일 {new Date(ds.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
