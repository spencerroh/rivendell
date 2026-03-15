import type { ReactNode } from "react";

export const metadata = {
  title: "Admin — Rivendell",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
