import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const datasetId = searchParams.get("datasetId");

  const response = NextResponse.redirect(new URL("/access", request.url));

  if (datasetId) {
    response.cookies.set(`rivendell_key_${datasetId}`, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  response.cookies.set("rivendell_current_dataset", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
