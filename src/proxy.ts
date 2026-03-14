import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // /datasets/[datasetId] 경로에서 처리 (new 제외)
  const match = pathname.match(/^\/datasets\/([^/]+)(?:\/|$)/);
  if (match) {
    const datasetId = match[1];
    if (datasetId === "new") return NextResponse.next();

    const key = searchParams.get("key");

    if (key) {
      // ?key= 제거한 URL로 리다이렉트 + 쿠키 설정
      const url = request.nextUrl.clone();
      url.searchParams.delete("key");

      const response = NextResponse.redirect(url);
      response.cookies.set(`rivendell_key_${datasetId}`, key, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      response.cookies.set("rivendell_current_dataset", datasetId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }

    // key 파람 없이 데이터셋 방문 시에도 current_dataset 쿠키 갱신
    const existingKey = request.cookies.get(`rivendell_key_${datasetId}`)?.value;
    if (existingKey) {
      const response = NextResponse.next();
      response.cookies.set("rivendell_current_dataset", datasetId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/datasets/:path*"],
};
