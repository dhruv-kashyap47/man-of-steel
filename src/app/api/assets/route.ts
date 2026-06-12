import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";

export async function GET() {
  const assets = dataStore.getAssets();
  const plant = dataStore.getPlant();
  return NextResponse.json({
    assets: assets.map((a) => ({ ...a, plant })),
    total: assets.length,
  });
}
