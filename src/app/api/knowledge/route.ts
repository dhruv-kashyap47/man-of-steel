import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET() {
  return NextResponse.json({ documents: dataStore.getKnowledgeDocuments() });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = checkRateLimit(`knowledge:${ip}`, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const documentType = formData.get("document_type") as string;
    const machineType = formData.get("machine_type") as string | null;
    const content = formData.get("content") as string;
    const file = formData.get("file") as File | null;

    let textContent = content ?? "";
    let fileName = "uploaded-document.md";
    let fileType: "pdf" | "markdown" | "text" = "markdown";

    if (file) {
      fileName = file.name;
      if (file.name.endsWith(".pdf")) {
        fileType = "pdf";
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          const pdfModule = await import("pdf-parse");
          const pdfParse = "default" in pdfModule && pdfModule.default
            ? pdfModule.default
            : pdfModule;
          const parsed = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
          textContent = parsed.text;
        } catch {
          textContent = content || "PDF content could not be extracted.";
        }
      } else if (file.name.endsWith(".md")) {
        fileType = "markdown";
        textContent = await file.text();
      } else {
        fileType = "text";
        textContent = await file.text();
      }
    }

    if (!title || !textContent) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const doc = dataStore.addKnowledgeDocument({
      title,
      document_type: (documentType as "manual" | "sop" | "incident_report" | "maintenance_log") ?? "manual",
      file_name: fileName,
      file_type: fileType,
      content: textContent,
      asset_id: null,
      machine_type: machineType as Parameters<typeof dataStore.addKnowledgeDocument>[0]["machine_type"],
      tags: [],
      metadata: { uploaded: true },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
