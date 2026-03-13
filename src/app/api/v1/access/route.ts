import { NextRequest } from "next/server";
import { ok, err } from "@/lib/utils/response";
import { findDatasetByAdminKey } from "@/lib/auth/verifyApiKey";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("INVALID_JSON", "요청 본문이 올바르지 않습니다.", 400);
  }

  const key =
    body && typeof body === "object" && "key" in body
      ? String((body as Record<string, unknown>).key ?? "")
      : "";

  if (!key) {
    return err("MISSING_KEY", "key가 필요합니다.", 400);
  }

  const datasetId = findDatasetByAdminKey(key);
  if (!datasetId) {
    return err("UNAUTHORIZED", "유효하지 않은 관리자 키입니다.", 401);
  }

  return ok({ datasetId });
}
