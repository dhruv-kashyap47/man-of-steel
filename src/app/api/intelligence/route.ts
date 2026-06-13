import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";

export async function GET() {
  const intel = dataStore.getIntelligence();
  return NextResponse.json(intel);
}
