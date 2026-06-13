import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const priority = dataStore.getPriority(id);
  if (!priority) {
    return NextResponse.json({ error: "Priority not found" }, { status: 404 });
  }
  const asset = dataStore.getAsset(id);
  return NextResponse.json({
    priority,
    asset: asset ?? null,
  });
}
