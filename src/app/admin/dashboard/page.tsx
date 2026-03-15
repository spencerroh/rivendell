import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/admin/auth";
import { getAdminDatasetsWithStats } from "@/lib/admin/queries";
import { Header } from "@/components/layout/Header";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!verifyAdminToken(token)) {
    redirect("/admin/login");
  }

  const { summary, datasets } = getAdminDatasetsWithStats();

  const currentDatasetId = cookieStore.get("rivendell_current_dataset")?.value;
  const currentAdminKey = currentDatasetId
    ? cookieStore.get(`rivendell_key_${currentDatasetId}`)?.value
    : undefined;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header
        datasetId={currentDatasetId}
        adminKey={currentAdminKey}
        rightSlot={<LogoutButton />}
      />
      <div className="flex-1 overflow-y-auto">
        <AdminDashboardClient summary={summary} datasets={datasets} />
      </div>
    </div>
  );
}
