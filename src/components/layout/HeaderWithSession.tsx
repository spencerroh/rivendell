import { cookies } from "next/headers";
import { Header } from "./Header";

interface HeaderWithSessionProps {
  datasetId?: string;
  adminKey?: string;
}

export async function HeaderWithSession({ datasetId, adminKey }: HeaderWithSessionProps) {
  const cookieStore = await cookies();
  const currentDatasetId =
    datasetId ?? cookieStore.get("rivendell_current_dataset")?.value;

  // 설정 링크: adminKey prop이 없으면 쿠키에서 가져옴
  const resolvedAdminKey =
    adminKey ??
    (currentDatasetId
      ? cookieStore.get(`rivendell_key_${currentDatasetId}`)?.value
      : undefined);

  return (
    <Header
      datasetId={currentDatasetId}
      adminKey={resolvedAdminKey}
    />
  );
}
