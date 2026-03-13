"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  datasetId: string;
  datasetName: string;
  adminKey: string;
  currentPage: "dashboard" | "settings";
}

export function AppHeader({
  datasetId,
  datasetName,
  adminKey,
  currentPage,
}: AppHeaderProps) {
  const tabs = [
    {
      label: "Dashboard",
      href: `/datasets/${datasetId}`,
      page: "dashboard" as const,
    },
    {
      label: "Settings",
      href: `/datasets/${datasetId}/settings`,
      page: "settings" as const,
    },
  ];

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">R</span>
              </div>
              <span className="font-semibold text-foreground">Rivendell</span>
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm font-medium ml-2 truncate max-w-[200px]">
              {datasetName}
            </span>
          </div>
        </div>
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.page}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                currentPage === tab.page
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
