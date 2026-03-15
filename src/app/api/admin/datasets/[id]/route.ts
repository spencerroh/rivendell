import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin/auth";
import { deleteDatasetCascade } from "@/lib/admin/queries";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteDatasetCascade(id);

  if (!deleted) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Dataset not found" } }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
