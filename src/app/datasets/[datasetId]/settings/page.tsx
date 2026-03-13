import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HeaderWithSession as Header } from "@/components/layout/HeaderWithSession";
import { ColumnAliasSection } from "@/components/settings/ColumnAliasSection";
import { KeyManagementSection } from "@/components/settings/KeyManagementSection";
import { DatasetInfoSection } from "@/components/settings/DatasetInfoSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db/client";
import { datasets, datasetSchemaFields, apiKeys } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { verifyAdminKey } from "@/lib/auth/verifyApiKey";
import type { SchemaField, ApiKeyInfo } from "@/types";

interface PageProps {
  params: Promise<{ datasetId: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function SettingsPage({ params, searchParams }: PageProps) {
  const { datasetId } = await params;
  const sp = await searchParams;

  const cookieStore = await cookies();
  const adminKey =
    sp.key ?? cookieStore.get(`rivendell_key_${datasetId}`)?.value ?? "";

  if (!adminKey) redirect(`/access`);

  const auth = verifyAdminKey(datasetId, adminKey);
  if (!auth.valid) redirect(`/access`);

  const dataset = db.select().from(datasets).where(eq(datasets.id, datasetId)).get();
  if (!dataset) redirect("/");

  const schemaFields = db
    .select()
    .from(datasetSchemaFields)
    .where(eq(datasetSchemaFields.datasetId, datasetId))
    .all() as SchemaField[];

  const keyRows = db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.datasetId, datasetId), isNull(apiKeys.revokedAt)))
    .all();

  const keyInfos: ApiKeyInfo[] = keyRows.map((k) => ({
    id: k.id,
    keyType: k.keyType,
    keyPrefix: k.keyPrefix,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
  }));

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header datasetId={datasetId} adminKey={adminKey} />
      <div className="flex-1 overflow-y-auto">
      <main className="max-w-7xl mx-auto w-full px-6 pt-8 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-sm text-muted-foreground mt-1">{dataset.name} · <span className="font-mono">{datasetId}</span></p>
        </div>

        <Separator />

        {/* Dataset Info */}
        <DatasetInfoSection
          datasetId={datasetId}
          adminKey={adminKey}
          name={dataset.name}
          description={dataset.description ?? null}
        />

        <ColumnAliasSection
          datasetId={datasetId}
          adminKey={adminKey}
          schemaFields={schemaFields}
        />

        <KeyManagementSection
          datasetId={datasetId}
          adminKey={adminKey}
          keys={keyInfos}
        />

        {/* Danger Zone */}
        <DangerZoneSection
          datasetId={datasetId}
          adminKey={adminKey}
        />
      </main>
      </div>
    </div>
  );
}
