import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HeaderWithSession as Header } from "@/components/layout/HeaderWithSession";
import { DashboardClient } from "./_components/DashboardClient";
import { db } from "@/db/client";
import { datasets, datasetSchemaFields, events, apiKeys } from "@/db/schema";
import { eq, and, isNull, gte, sql } from "drizzle-orm";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import type { SchemaField } from "@/types";

interface PageProps {
  params: Promise<{ datasetId: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function DashboardPage({ params, searchParams }: PageProps) {
  const { datasetId } = await params;
  const sp = await searchParams;

  // admin_key: URL query param 또는 cookie에서
  const cookieStore = await cookies();
  const adminKey =
    sp.key ?? cookieStore.get(`rivendell_key_${datasetId}`)?.value ?? "";

  if (!adminKey) {
    redirect(`/access`);
  }

  const auth = verifyAdminKey(datasetId, adminKey);
  if (!auth.valid) {
    redirect(`/access`);
  }

  const dataset = db.select().from(datasets).where(eq(datasets.id, datasetId)).get();
  if (!dataset) {
    redirect("/");
  }

  const dbSchemaFields = db
    .select()
    .from(datasetSchemaFields)
    .where(eq(datasetSchemaFields.datasetId, datasetId))
    .all() as SchemaField[];

  // DB에 행이 없는 dim/metric도 기본값으로 채워 항상 전체 컬럼 표시
  const fieldMap = new Map(dbSchemaFields.map((f) => [f.fieldKey, f]));
  const allKeys = [
    ...["dim1","dim2","dim3","dim4","dim5","dim6","dim7","dim8","dim9","dim10"].map((key, i) => ({ key, type: "dim" as const, i })),
    ...["metric1","metric2","metric3","metric4","metric5","metric6","metric7","metric8","metric9","metric10"].map((key, i) => ({ key, type: "metric" as const, i })),
  ];
  const schemaFields: SchemaField[] = allKeys.map(({ key, type, i }) =>
    fieldMap.get(key) ?? { id: "", datasetId, fieldKey: key, label: "", fieldType: type, visible: 1, sortOrder: i }
  );

  // KPI
  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(events)
    .where(eq(events.datasetId, datasetId))
    .get();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const events7dResult = db
    .select({ count: sql<number>`count(*)` })
    .from(events)
    .where(and(eq(events.datasetId, datasetId), gte(events.occurredAt, sevenDaysAgo)))
    .get();

  const uniqueActorsResult = db
    .select({ count: sql<number>`count(distinct actor_id)` })
    .from(events)
    .where(eq(events.datasetId, datasetId))
    .get();

  const lastEvent = db
    .select({ receivedAt: events.receivedAt })
    .from(events)
    .where(eq(events.datasetId, datasetId))
    .orderBy(sql`${events.receivedAt} DESC`)
    .limit(1)
    .get();

  const kpi = {
    totalEvents: totalResult?.count ?? 0,
    events7d: events7dResult?.count ?? 0,
    uniqueActors: uniqueActorsResult?.count ?? 0,
    lastIngestedAt: lastEvent?.receivedAt ?? null,
  };

  // Initial events
  const initialRows = db
    .select()
    .from(events)
    .where(eq(events.datasetId, datasetId))
    .orderBy(sql`${events.occurredAt} DESC`)
    .limit(50)
    .all();

  const totalRows = totalResult?.count ?? 0;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header datasetId={datasetId} adminKey={adminKey} />
      <div className="flex-1 overflow-y-auto">
      <main className="max-w-7xl mx-auto w-full px-6 py-8">
        <DashboardClient
          datasetId={datasetId}
          datasetName={dataset.name}
          adminKey={adminKey}
          schemaFields={schemaFields}
          initialKpi={kpi}
          initialEvents={{
            data: initialRows as Parameters<typeof DashboardClient>[0]["initialEvents"]["data"],
            total: totalRows,
            page: 1,
            page_size: 50,
            total_pages: Math.ceil(totalRows / 50),
          }}
        />
      </main>
      </div>
    </div>
  );
}
