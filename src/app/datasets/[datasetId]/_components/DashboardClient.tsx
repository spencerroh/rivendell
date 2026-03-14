"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { EventTable } from "@/components/dashboard/EventTable";
import { EventDetailDrawer } from "@/components/dashboard/EventDetailDrawer";
import { ExportModal } from "@/components/dashboard/ExportModal";
import { Download, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ColumnSelector } from "@/components/dashboard/ColumnSelector";
import type { EventRow, SchemaField, EventFilters } from "@/types";

interface KpiData {
  totalEvents: number;
  events7d: number;
  uniqueActors: number;
  lastIngestedAt: string | null;
}

interface EventsData {
  data: EventRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface DashboardClientProps {
  datasetId: string;
  datasetName: string;
  adminKey: string;
  schemaFields: SchemaField[];
  initialKpi: KpiData;
  initialEvents: EventsData;
}

export function DashboardClient({
  datasetId,
  datasetName,
  adminKey,
  schemaFields,
  initialKpi,
  initialEvents,
}: DashboardClientProps) {
  const router = useRouter();

  const [kpi] = useState<KpiData>(initialKpi);
  const [eventsData, setEventsData] = useState<EventsData>(initialEvents);
  const [filters, setFilters] = useState<EventFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultColumns = [
    ...schemaFields.filter((f) => f.visible === 1 && f.fieldType === "dim").map((f) => f.fieldKey),
    ...schemaFields.filter((f) => f.visible === 1 && f.fieldType === "metric").map((f) => f.fieldKey),
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [pageSize, setPageSize] = useState(50);

  const fetchEvents = useCallback(
    async (f: EventFilters, page: number, ps: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (f.from) params.set("from", f.from);
        if (f.to) params.set("to", f.to);
        if (f.event_name) params.set("event_name", f.event_name);
        if (f.actor_id) params.set("actor_id", f.actor_id);
        if (f.source) params.set("source", f.source);
        if (f.status) params.set("status", f.status);
        if (f.dim_col) params.set("dim_col", f.dim_col);
        if (f.dim_val) params.set("dim_val", f.dim_val);
        if (f.metric_col) params.set("metric_col", f.metric_col);
        if (f.metric_op) params.set("metric_op", f.metric_op);
        if (f.metric_val1) params.set("metric_val1", f.metric_val1);
        if (f.metric_val2) params.set("metric_val2", f.metric_val2);
        params.set("page", String(page));
        params.set("page_size", String(ps));

        const res = await fetch(
          `/api/v1/datasets/${datasetId}/events?${params.toString()}`,
          { headers: { Authorization: `Bearer ${adminKey}` } }
        );
        if (res.ok) {
          const json = await res.json();
          setEventsData(json.data);
        }
      } finally {
        setLoading(false);
      }
    },
    [datasetId, adminKey]
  );

  function handleApplyFilters(f: EventFilters) {
    setFilters(f);
    fetchEvents(f, 1, pageSize);
  }

  function handleResetFilters() {
    setFilters({});
    fetchEvents({}, 1, pageSize);
  }

  function handlePageChange(page: number) {
    fetchEvents(filters, page, pageSize);
  }

  function handlePageSizeChange(ps: number) {
    setPageSize(ps);
    fetchEvents(filters, 1, ps);
  }

  function handleRowClick(event: EventRow) {
    setSelectedEvent(event);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{datasetName}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{datasetId}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
          >
            <Download className="h-4 w-4 mr-1" />
            내보내기
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-200 text-rose-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-300"
            onClick={() => {
              router.push(`/api/auth/logout?datasetId=${encodeURIComponent(datasetId)}`);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            닫기
          </Button>
        </div>
      </div>

      <Separator />

      <KpiCards {...kpi} />

      <div className="space-y-3">
        <FilterBar
          filters={filters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          schemaFields={schemaFields}
        />

        <div className="flex justify-end">
          <ColumnSelector
            schemaFields={schemaFields}
            visibleColumns={visibleColumns}
            onChange={setVisibleColumns}
            settingsHref={`/datasets/${datasetId}/settings?key=${encodeURIComponent(adminKey)}`}
          />
        </div>

        <div className={loading ? "opacity-60 pointer-events-none" : ""}>
          <EventTable
            events={eventsData.data}
            total={eventsData.total}
            page={eventsData.page}
            pageSize={eventsData.page_size}
            schemaFields={schemaFields}
            visibleColumns={visibleColumns}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      <EventDetailDrawer
        event={selectedEvent}
        schemaFields={schemaFields}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        datasetId={datasetId}
        adminKey={adminKey}
        currentFilters={filters}
      />
    </div>
  );
}
