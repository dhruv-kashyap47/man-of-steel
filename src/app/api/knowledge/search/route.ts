import { NextResponse } from "next/server";
import { semanticSearch } from "@/lib/rag/search";
import type { DocumentType, MachineType } from "@/types/database";

export async function POST(req: Request) {
  const body = await req.json();
  const { query, machineType, documentType, limit } = body as {
    query: string;
    machineType?: MachineType;
    documentType?: DocumentType;
    limit?: number;
  };

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const citations = await semanticSearch({ query, machineType, documentType, limit });
  return NextResponse.json({ citations, query });
}
