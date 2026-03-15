import { db } from "@/db/client";
import {
  datasets,
  events,
  apiKeys,
  datasetSchemaFields,
  datasetAccessLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface AdminDatasetRow {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  eventCount: number;
  lastEventAt: string | null;
}

export interface AdminSummary {
  totalDatasets: number;
  totalEvents: number;
}

export function getAdminDatasetsWithStats(): {
  summary: AdminSummary;
  datasets: AdminDatasetRow[];
} {
  // 집계 쿼리: LEFT JOIN으로 이벤트 수 + 마지막 이벤트 시간
  const rows = db
    .select({
      id: datasets.id,
      name: datasets.name,
      description: datasets.description,
      createdAt: datasets.createdAt,
      eventCount: sql<number>`count(${events.id})`,
      lastEventAt: sql<string | null>`max(${events.occurredAt})`,
    })
    .from(datasets)
    .leftJoin(events, eq(events.datasetId, datasets.id))
    .where(sql`${datasets.archivedAt} IS NULL`)
    .groupBy(datasets.id)
    .orderBy(sql`${datasets.createdAt} DESC`)
    .all() as AdminDatasetRow[];

  const totalDatasets = rows.length;
  const totalEvents = rows.reduce((sum, r) => sum + (r.eventCount ?? 0), 0);

  return {
    summary: { totalDatasets, totalEvents },
    datasets: rows,
  };
}

/** 데이터셋과 연관 데이터 전체 삭제 (트랜잭션) */
export function deleteDatasetCascade(id: string): boolean {
  const existing = db
    .select({ id: datasets.id })
    .from(datasets)
    .where(eq(datasets.id, id))
    .get();

  if (!existing) return false;

  db.transaction((tx) => {
    tx.delete(datasetAccessLogs).where(eq(datasetAccessLogs.datasetId, id)).run();
    tx.delete(datasetSchemaFields).where(eq(datasetSchemaFields.datasetId, id)).run();
    tx.delete(apiKeys).where(eq(apiKeys.datasetId, id)).run();
    tx.delete(events).where(eq(events.datasetId, id)).run();
    tx.delete(datasets).where(eq(datasets.id, id)).run();
  });

  return true;
}
