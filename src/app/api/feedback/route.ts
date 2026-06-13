import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET() {
  const feedback = dataStore.getFeedback();
  const assets = dataStore.getAssets();
  const data = feedback.map((f) => {
    const asset = assets.find((a) => a.id === f.asset_id);
    return { ...f, assetName: asset?.name ?? "Unknown" };
  });
  return NextResponse.json({ feedback: data, total: data.length });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = checkRateLimit(`feedback:${ip}`, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { assetId, query, diagnosis, prediction, recommendation, actualOutcome, rootCause, resolution, engineerFeedback, resolutionNotes } = body;

    if (!assetId || !query || !engineerFeedback) {
      return NextResponse.json({ error: "assetId, query, and engineerFeedback are required" }, { status: 400 });
    }

    const entry = dataStore.addFeedback({
      asset_id: assetId,
      query,
      diagnosis: diagnosis ?? "",
      prediction: prediction ?? {},
      recommendation: recommendation ?? "",
      actual_outcome: actualOutcome ?? "",
      root_cause: rootCause ?? "",
      resolution: resolution ?? "",
      engineer_feedback: engineerFeedback,
      resolution_notes: resolutionNotes ?? "",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ feedback: entry }, { status: 201 });
  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 });
  }
}
