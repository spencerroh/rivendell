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

  const schemaFields = db
    .select()
    .from(datasetSchemaFields)
    .where(eq(datasetSchemaFields.datasetId, datasetId))
    .all() as SchemaField[];

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
