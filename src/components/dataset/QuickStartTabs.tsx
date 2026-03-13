"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuickStartTabsProps {
  datasetId: string;
  ingestKey: string;
}

export function QuickStartTabs({ datasetId, ingestKey }: QuickStartTabsProps) {
  const [tab, setTab] = useState<"curl" | "js">("curl");

  const curlExample = `curl -X POST https://your-domain/api/v1/ingest/events \\
  -H "Authorization: Bearer ${ingestKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "${datasetId}",
    "events": [{
      "event_name": "page_view",
      "actor_id": "user_123",
      "source": "web"
    }]
  }'`;

  const jsExample = `const res = await fetch('/api/v1/ingest/events', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${ingestKey}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    dataset_id: '${datasetId}',
    events: [{
      event_name: 'page_view',
      actor_id: 'user_123',
      source: 'web',
    }],
  }),
});`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "curl" ? "default" : "outline"}
          onClick={() => setTab("curl")}
        >
          cURL
        </Button>
        <Button
          size="sm"
          variant={tab === "js" ? "default" : "outline"}
          onClick={() => setTab("js")}
        >
          JavaScript
        </Button>
      </div>
      <pre className="bg-zinc-950 text-zinc-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap">
        {tab === "curl" ? curlExample : jsExample}
      </pre>
    </div>
  );
}
