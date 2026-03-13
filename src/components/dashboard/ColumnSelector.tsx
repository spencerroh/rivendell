"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns } from "lucide-react";
import type { SchemaField } from "@/types";

interface ColumnSelectorProps {
  schemaFields: SchemaField[];
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
  settingsHref?: string;
}

export function ColumnSelector({
  schemaFields,
  visibleColumns,
  onChange,
  settingsHref,
}: ColumnSelectorProps) {
  const dims = schemaFields.filter((f) => f.fieldType === "dim");
  const metrics = schemaFields.filter((f) => f.fieldType === "metric");

  function toggle(fieldKey: string) {
    if (visibleColumns.includes(fieldKey)) {
      onChange(visibleColumns.filter((c) => c !== fieldKey));
    } else {
      onChange([...visibleColumns, fieldKey]);
    }
  }

  const totalCount = schemaFields.length;
  const visibleCount = visibleColumns.filter((c) =>
    schemaFields.some((f) => f.fieldKey === c)
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Columns className="h-3.5 w-3.5 mr-1.5" />
          컬럼
          {totalCount > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              {visibleCount}/{totalCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {dims.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              차원
            </DropdownMenuLabel>
            {dims.map((f) => (
              <DropdownMenuCheckboxItem
                key={f.fieldKey}
                checked={visibleColumns.includes(f.fieldKey)}
                onCheckedChange={() => toggle(f.fieldKey)}
                className="text-sm"
              >
                <span className="truncate">{f.label || f.fieldKey}</span>
                <code className="ml-auto text-xs text-muted-foreground">
                  {f.fieldKey}
                </code>
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        {dims.length > 0 && metrics.length > 0 && <DropdownMenuSeparator />}

        {metrics.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              지표
            </DropdownMenuLabel>
            {metrics.map((f) => (
              <DropdownMenuCheckboxItem
                key={f.fieldKey}
                checked={visibleColumns.includes(f.fieldKey)}
                onCheckedChange={() => toggle(f.fieldKey)}
                className="text-sm"
              >
                <span className="truncate">{f.label || f.fieldKey}</span>
                <code className="ml-auto text-xs text-muted-foreground">
                  {f.fieldKey}
                </code>
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}

        {totalCount === 0 && (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center space-y-1">
            <p>스키마 필드가 정의되지 않았습니다.</p>
            {settingsHref && (
              <p>
                <Link
                  href={settingsHref}
                  className="text-primary underline underline-offset-2 hover:opacity-80"
                >
                  설정
                </Link>
                에서 필드를 정의할 수 있습니다.
              </p>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
