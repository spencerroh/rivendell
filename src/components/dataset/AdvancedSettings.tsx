"use client";

import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface DimAlias {
  key: string;
  label: string;
}

export interface MetricAlias {
  key: string;
  label: string;
}

interface AdvancedSettingsProps {
  dims: DimAlias[];
  metrics: MetricAlias[];
  onDimsChange: (dims: DimAlias[]) => void;
  onMetricsChange: (metrics: MetricAlias[]) => void;
}

const DIM_KEYS = [
  "dim1", "dim2", "dim3", "dim4", "dim5",
  "dim6", "dim7", "dim8", "dim9", "dim10",
];
const METRIC_KEYS = ["metric1", "metric2", "metric3"];

export function AdvancedSettings({
  dims,
  metrics,
  onDimsChange,
  onMetricsChange,
}: AdvancedSettingsProps) {
  function getDimLabel(key: string): string {
    return dims.find((d) => d.key === key)?.label ?? "";
  }

  function getMetricLabel(key: string): string {
    return metrics.find((m) => m.key === key)?.label ?? "";
  }

  function updateDim(key: string, label: string) {
    const existing = dims.filter((d) => d.key !== key);
    if (label.trim()) {
      onDimsChange([...existing, { key, label: label.trim() }]);
    } else {
      onDimsChange(existing);
    }
  }

  function updateMetric(key: string, label: string) {
    const existing = metrics.filter((m) => m.key !== key);
    if (label.trim()) {
      onMetricsChange([...existing, { key, label: label.trim() }]);
    } else {
      onMetricsChange(existing);
    }
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced">
        <AccordionTrigger className="text-sm text-muted-foreground">
          고급 설정 (컬럼 별칭)
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <p className="text-sm font-medium">문자열 컬럼 (dim)</p>
              <p className="text-xs text-muted-foreground">
                dim1~dim10의 표시 이름을 설정하세요. 비워두면 기본 키 이름으로 표시됩니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {DIM_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <code className="text-xs w-14 text-muted-foreground shrink-0">
                      {key}
                    </code>
                    <Input
                      placeholder={key}
                      value={getDimLabel(key)}
                      onChange={(e) => updateDim(key, e.target.value)}
                      className="flex-1 h-8 text-sm"
                      maxLength={50}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">숫자 컬럼 (metric)</p>
              <p className="text-xs text-muted-foreground">
                metric1~metric3의 표시 이름을 설정하세요. 비워두면 기본 키 이름으로 표시됩니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {METRIC_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <code className="text-xs w-14 text-muted-foreground shrink-0">
                      {key}
                    </code>
                    <Input
                      placeholder={key}
                      value={getMetricLabel(key)}
                      onChange={(e) => updateMetric(key, e.target.value)}
                      className="flex-1 h-8 text-sm"
                      maxLength={50}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
