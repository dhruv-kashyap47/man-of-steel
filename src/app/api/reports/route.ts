import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import {
  buildIncidentReport,
  buildMaintenanceReport,
  buildExecutiveSummary,
  buildPriorityReport,
  buildFeedbackLearningReport,
  buildMaintenanceIntelligenceReport,
} from "@/lib/reports/builder";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET() {
  return NextResponse.json({ reports: dataStore.getReports() });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = checkRateLimit(`reports:${ip}`, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { type, assetId } = body as {
      type: "incident" | "maintenance" | "executive_summary" | "priority" | "feedback_learning" | "intelligence";
      assetId?: string;
    };

    let reportData;
    switch (type) {
      case "incident":
        if (!assetId) return NextResponse.json({ error: "assetId required" }, { status: 400 });
        reportData = buildIncidentReport(assetId);
        break;
      case "maintenance":
        if (!assetId) return NextResponse.json({ error: "assetId required" }, { status: 400 });
        reportData = buildMaintenanceReport(assetId);
        break;
      case "executive_summary":
        reportData = buildExecutiveSummary();
        break;
      case "priority":
        reportData = buildPriorityReport();
        break;
      case "feedback_learning":
        reportData = buildFeedbackLearningReport();
        break;
      case "intelligence":
        reportData = buildMaintenanceIntelligenceReport();
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    const report = dataStore.addReport(reportData);
    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
