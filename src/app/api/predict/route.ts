import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import { predictFailure, whatIfAnalysis } from "@/lib/ml/predict";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { MachineType } from "@/types/database";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = checkRateLimit(`predict:${ip}`, 60, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const { assetId, features, whatIf } = body as {
    assetId?: string;
    features?: {
      temperature_c: number;
      pressure_bar: number;
      rpm: number;
      vibration_mm_s: number;
      operating_hours: number;
    };
    whatIf?: Partial<{
      temperature_c: number;
      pressure_bar: number;
      rpm: number;
      vibration_mm_s: number;
      operating_hours: number;
    }>;
  };

  let machineType: MachineType = "rolling_mill";
  let baseFeatures = features;

  if (assetId) {
    const asset = dataStore.getAsset(assetId);
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    machineType = asset.machine_type;
    if (!baseFeatures) {
      const readings = dataStore.getSensorReadings(assetId);
      const latest = readings[readings.length - 1];
      if (latest) {
        baseFeatures = {
          temperature_c: latest.temperature_c,
          pressure_bar: latest.pressure_bar,
          rpm: latest.rpm,
          vibration_mm_s: latest.vibration_mm_s,
          operating_hours: asset.operating_hours,
        };
      }
    }
  }

  if (!baseFeatures) {
    return NextResponse.json({ error: "Features or assetId required" }, { status: 400 });
  }

  const result = whatIf
    ? whatIfAnalysis(baseFeatures, machineType, whatIf)
    : predictFailure(baseFeatures, machineType);

  return NextResponse.json({ prediction: result, machineType });
}
