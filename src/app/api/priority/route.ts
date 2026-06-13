import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";

export async function GET() {
  const priorities = dataStore.getPriorities();
  const assets = dataStore.getAssets();

  const data = priorities.map((p) => {
    const asset = assets.find((a) => a.id === p.asset_id);
    return {
      assetId: p.asset_id,
      assetName: asset?.name ?? "Unknown",
      machineType: asset?.machine_type ?? "unknown",
      priorityScore: p.priority_score,
      priorityLevel: p.priority_level,
      failureRisk: p.failure_risk,
      remainingUsefulLifeHours: p.remaining_useful_life_hours,
      processCriticality: p.process_criticality,
      productionImpact: p.production_impact,
      spareAvailability: p.spare_availability,
      procurementLeadTimeDays: p.procurement_lead_time_days,
      maintenanceWindow: p.maintenance_window,
      procurementRecommendation: p.procurement_recommendation,
      businessImpactSummary: p.business_impact_summary,
      healthScore: asset?.health_score ?? 0,
      riskLevel: asset?.risk_level ?? "medium",
    };
  });

  return NextResponse.json({ priorities: data, total: data.length });
}
