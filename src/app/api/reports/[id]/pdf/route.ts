import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import { generateReportPDF } from "@/lib/reports/generate-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reports = dataStore.getReports();
  const report = reports.find((r) => r.id === id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const plant = dataStore.getPlant();
  const asset = report.asset_id ? dataStore.getAsset(report.asset_id) : undefined;

  const pdfBuffer = await generateReportPDF({ report, plant, asset });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
    },
  });
}
