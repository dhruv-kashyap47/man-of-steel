import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import type { Asset, FailurePrediction } from "@/types/database";

function computeRootCauses(assets: Asset[], predictions: FailurePrediction[]) {
  const sorted = [...predictions].sort(
    (a, b) => b.failure_probability - a.failure_probability
  );
  return sorted.slice(0, 4).map((pred) => {
    const asset = assets.find((a) => a.id === pred.asset_id);
    const cause =
      pred.failure_probability > 0.75
        ? "Bearing degradation progressing rapidly — high wear particle count detected"
        : pred.failure_probability > 0.5
          ? "Lubrication film breakdown — marginal oil viscosity and elevated temperature"
          : pred.failure_probability > 0.3
            ? "Minor misalignment detected — coupling wear within acceptable band"
            : "Normal wear patterns — no immediate intervention required";
    const confidence = 0.65 + pred.failure_probability * 0.3;
    const evidence: string[] = [];
    if (pred.predicted_failure_mode) {
      evidence.push(`Model predicts ${pred.predicted_failure_mode.toLowerCase()}`);
    }
    const assetAlerts = dataStore.getAlerts().filter(
      (a) => a.asset_id === pred.asset_id && a.status === "active"
    );
    assetAlerts.slice(0, 2).forEach((a) => {
      evidence.push(a.title);
    });
    evidence.push(`Health score: ${asset?.health_score}%, RUL: ${pred.remaining_useful_life_hours}h`);
    return {
      assetName: asset?.name ?? "Unknown",
      assetId: pred.asset_id,
      likelyCause: cause,
      confidence: Math.round(confidence * 100),
      evidence: evidence.slice(0, 3),
      failureProbability: pred.failure_probability,
    };
  });
}

function computeExecutiveInsights(assets: Asset[], predictions: FailurePrediction[]) {
  const sortedByRisk = [...predictions].sort(
    (a, b) => b.failure_probability - a.failure_probability
  );
  const topRisk = sortedByRisk[0];
  const topRiskAsset = assets.find((a) => a.id === topRisk?.asset_id);

  const sortedByHealth = [...assets].sort(
    (a, b) => a.health_score - b.health_score
  );
  const immediate = sortedByHealth[0];

  const totalDowntimeRisk = predictions
    .filter((p) => p.failure_probability > 0.4)
    .reduce((sum, p) => sum + (p.remaining_useful_life_hours > 500 ? 72 : 168), 0);

  const avgHealth = assets.reduce((s, a) => s + a.health_score, 0) / assets.length;
  const improvingAsset = assets.find((a) => a.health_score > avgHealth + 10 && a.status === "operational");

  return {
    topRiskAsset: topRiskAsset
      ? { name: topRiskAsset.name, probability: topRisk.failure_probability }
      : null,
    topRiskValue: topRisk?.failure_probability ?? 0,
    mostImprovedAsset: improvingAsset?.name ?? assets[0].name,
    immediateAttentionAsset: { name: immediate.name, health: immediate.health_score },
    projectedDowntimeRisk: totalDowntimeRisk,
    avgHealthScore: Math.round(avgHealth * 10) / 10,
  };
}

export async function GET() {
  const plant = dataStore.getPlant();
  const assets = dataStore.getAssets();
  const alerts = dataStore.getActiveAlerts();
  const criticalAssets = dataStore.getCriticalAssets();
  const predictions = dataStore.getPredictions();
  const insights = dataStore.getInsights();

  const alertsWithAssets = alerts.slice(0, 8).map((alert) => ({
    ...alert,
    asset: assets.find((a) => a.id === alert.asset_id),
  }));

  const rootCauses = computeRootCauses(assets, predictions);
  const executiveInsights = computeExecutiveInsights(assets, predictions);

  return NextResponse.json({
    plant,
    healthScore: plant.health_score,
    activeAlerts: alerts.length,
    criticalAssets,
    failureForecasts: predictions
      .sort((a, b) => b.failure_probability - a.failure_probability)
      .slice(0, 5),
    insights: insights.sort((a, b) => b.priority - a.priority),
    recentAlerts: alertsWithAssets,
    assetCount: assets.length,
    operationalCount: assets.filter((a) => a.status === "operational").length,
    rootCauses,
    executiveInsights,
  });
}
