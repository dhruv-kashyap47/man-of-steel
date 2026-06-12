import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import { predictFromLatestSensors } from "@/lib/ml/predict";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = dataStore.getAsset(id);
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const readings = dataStore.getSensorReadings(id);
  const latest = readings[readings.length - 1];
  const maintenance = dataStore.getMaintenanceRecords(id);
  const alerts = dataStore.getAlerts().filter((a) => a.asset_id === id);
  const prediction = dataStore.getPrediction(id);

  let livePrediction = prediction;
  if (latest) {
    const live = predictFromLatestSensors(
      {
        temperature_c: latest.temperature_c,
        pressure_bar: latest.pressure_bar,
        rpm: latest.rpm,
        vibration_mm_s: latest.vibration_mm_s,
        operating_hours: latest.operating_hours,
      },
      asset.machine_type,
      asset.operating_hours
    );
    livePrediction = {
      id: prediction?.id ?? "live",
      asset_id: id,
      model_version: "v1.0-xgb",
      predicted_at: new Date().toISOString(),
      created_at: prediction?.created_at ?? new Date().toISOString(),
      predicted_failure_mode: live.predictedFailureMode,
      confidence: live.confidence,
      failure_probability: live.failureProbability,
      remaining_useful_life_hours: live.remainingUsefulLifeHours,
      input_features: live.features,
    };
  }

  return NextResponse.json({
    asset,
    sensorReadings: readings,
    maintenance,
    alerts,
    prediction: livePrediction,
    latestReading: latest ?? null,
  });
}
