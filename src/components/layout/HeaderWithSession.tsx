import { Header } from "./Header";

interface HeaderWithSessionProps {
  datasetId?: string;
  adminKey?: string;
}

export async function HeaderWithSession({ datasetId, adminKey }: HeaderWithSessionProps) {
  // 명시적으로 전달된 props만 사용 — 쿠키 fallback 없음
  // (데이터셋 대시보드/설정 페이지에서만 datasetId를 prop으로 전달)
  return <Header datasetId={datasetId} adminKey={adminKey} />;
}
