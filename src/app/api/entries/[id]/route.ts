import { NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device";
import { getStore } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await getStore(await getDeviceId()).deleteEntry(id);
  if (!deleted) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
