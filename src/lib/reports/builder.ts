import { dataStore } from "@/lib/data/store";
import type { ReportType } from "@/types/database";

export function buildIncidentReport(assetId: string) {
  const asset = dataStore.getAsset(assetId);
  if (!asset) throw new Error("Asset not found");

  const alerts = dataStore.getAlerts().filter((a) => a.asset_id === assetId && a.status === "active");
  const prediction = dataStore.getPrediction(assetId);
  const maintenance = dataStore.getMaintenanceRecords(assetId).slice(0, 3);

  return {
    report_type: "incident" as ReportType,
    title: `Incident Report — ${asset.name} (${asset.serial_number})`,
    asset_id: assetId,
    plant_id: asset.plant_id,
    content: {
      executiveSummary: `Active incident investigation for ${asset.name}. Current health score: ${asset.health_score}%. ${alerts.length} active alert(s) requiring attention.`,
      sections: [
        {
          title: "Incident Overview",
          body: alerts.map((a) => `${a.severity.toUpperCase()}: ${a.title} — ${a.description}`).join("\n\n") || "No active alerts.",
        },
        {
          title: "Failure Prediction",
          body: prediction
            ? `Failure probability: ${(prediction.failure_probability * 100).toFixed(1)}%. Estimated RUL: ${prediction.remaining_useful_life_hours} hours. Predicted mode: ${prediction.predicted_failure_mode}.`
            : "Prediction data unavailable.",
        },
        {
          title: "Recent Maintenance History",
          body: maintenance.map((m) => `${m.performed_at.split("T")[0]}: ${m.title} (${m.maintenance_type})`).join("\n") || "No recent maintenance.",
        },
      ],
      metrics: {
        "Health Score": `${asset.health_score}%`,
        "Risk Level": asset.risk_level,
        "Operating Hours": asset.operating_hours.toLocaleString(),
        "Active Alerts": alerts.length,
      },
      recommendations: [
        "Acknowledge all critical alerts within 2 hours",
        "Schedule emergency inspection if vibration > 6.5 mm/s",
        "Review maintenance SOPs for this machine type",
      ],
    },
    generated_by: "MAN OF STEEL Agent System",
    pdf_path: null,
  };
}

export function buildMaintenanceReport(assetId: string) {
  const asset = dataStore.getAsset(assetId);
  if (!asset) throw new Error("Asset not found");

  const records = dataStore.getMaintenanceRecords(assetId);
  const prediction = dataStore.getPrediction(assetId);

  return {
    report_type: "maintenance" as ReportType,
    title: `Maintenance Report — ${asset.name}`,
    asset_id: assetId,
    plant_id: asset.plant_id,
    content: {
      executiveSummary: `Comprehensive maintenance status for ${asset.name}. ${records.length} maintenance events on record. Next recommended action based on RUL: ${prediction?.remaining_useful_life_hours ?? "N/A"} hours.`,
      sections: [
        {
          title: "Asset Condition",
          body: `Status: ${asset.status}. Health: ${asset.health_score}%. Risk: ${asset.risk_level}. Last maintenance: ${asset.last_maintenance ? new Date(asset.last_maintenance).toLocaleDateString() : "N/A"}.`,
        },
        {
          title: "Maintenance History",
          body: records
            .map(
              (m) =>
                `[${new Date(m.performed_at).toLocaleDateString()}] ${m.title}\n  Type: ${m.maintenance_type} | Tech: ${m.technician} | Cost: $${m.cost_usd?.toLocaleString() ?? "N/A"} | Downtime: ${m.downtime_hours}h`
            )
            .join("\n\n"),
        },
        {
          title: "Predictive Analysis",
          body: prediction
            ? `Model ${prediction.model_version}: ${(prediction.failure_probability * 100).toFixed(1)}% failure probability. Confidence: ${(prediction.confidence * 100).toFixed(0)}%.`
            : "No prediction available.",
        },
      ],
      metrics: {
        "Total Maintenance Events": records.length,
        "Total Downtime (hrs)": records.reduce((s, m) => s + (m.downtime_hours ?? 0), 0),
        "Total Cost (USD)": `$${records.reduce((s, m) => s + (m.cost_usd ?? 0), 0).toLocaleString()}`,
        "Failure Probability": prediction ? `${(prediction.failure_probability * 100).toFixed(1)}%` : "N/A",
      },
      recommendations: [
        prediction && prediction.failure_probability > 0.5
          ? "Schedule predictive maintenance within 7 days"
          : "Continue current maintenance schedule",
        "Update maintenance log after next service",
        "Verify spare parts inventory for critical components",
      ],
    },
    generated_by: "MAN OF STEEL Agent System",
    pdf_path: null,
  };
}

export function buildExecutiveSummary() {
  const plant = dataStore.getPlant();
  const assets = dataStore.getAssets();
  const alerts = dataStore.getActiveAlerts();
  const insights = dataStore.getInsights();
  const predictions = dataStore.getPredictions();
  const critical = assets.filter((a) => a.status === "critical" || a.risk_level === "critical");

  const avgHealth = (assets.reduce((s, a) => s + a.health_score, 0) / assets.length).toFixed(1);
  const topRisk = [...predictions].sort((a, b) => b.failure_probability - a.failure_probability)[0];
  const topRiskAsset = assets.find((a) => a.id === topRisk?.asset_id);
  const totalDowntimeRisk = predictions
    .filter((p) => p.failure_probability > 0.4)
    .reduce((sum, p) => sum + (p.remaining_useful_life_hours > 500 ? 72 : 168), 0);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const infoCount = alerts.filter((a) => a.severity === "info").length;

  return {
    report_type: "executive_summary" as ReportType,
    title: `Executive Summary — ${plant.name}`,
    asset_id: null,
    plant_id: plant.id,
    content: {
      executiveSummary: `Plant health score: ${plant.health_score}%. ${assets.length} assets monitored, ${alerts.length} active alerts (${criticalCount} critical, ${warningCount} warning), ${critical.length} critical assets requiring executive attention. Average asset health: ${avgHealth}%. Projected downtime risk: ${totalDowntimeRisk} hours.`,
      sections: [
        {
          title: "Plant Health Overview",
          body: `Overall plant health is ${plant.health_score >= 80 ? "GOOD (Green)" : plant.health_score >= 60 ? "FAIR (Amber)" : "AT RISK (Red)"}. Facility: ${plant.name}. Capacity: ${plant.capacity}. Location: ${plant.location}. Assets under management: ${assets.length}. Average asset health across fleet: ${avgHealth}%.`,
        },
        {
          title: "Critical Assets — Risk Assessment",
          body:
            critical.length > 0
              ? critical.map((a) => {
                  const pred = predictions.find((p) => p.asset_id === a.id);
                  return `• ${a.name} (${a.serial_number})\n  Health: ${a.health_score}% | Risk: ${a.risk_level} | RUL: ${pred?.remaining_useful_life_hours?.toLocaleString() ?? "N/A"}h | Failure Prob: ${pred ? `${(pred.failure_probability * 100).toFixed(1)}%` : "N/A"}`
                }).join("\n")
              : "No critical assets at this time.",
        },
        {
          title: "Top Risk Asset Analysis",
          body: topRiskAsset
            ? `Highest risk: ${topRiskAsset.name} (${topRiskAsset.serial_number}). Failure probability: ${(topRisk!.failure_probability * 100).toFixed(1)}%. Predicted mode: ${topRisk?.predicted_failure_mode ?? "Unknown"}. RUL: ${topRisk?.remaining_useful_life_hours?.toLocaleString() ?? "N/A"} hours. Asset health: ${topRiskAsset.health_score}%. Immediate executive attention recommended.`
            : "Risk analysis unavailable.",
        },
        {
          title: "AI Intelligence Insights",
          body: insights.length > 0
            ? insights.map((i) => `[Priority ${i.priority}] ${i.title}\n  ${i.summary}${i.impact ? `\n  Impact: ${i.impact}` : ""}`).join("\n\n")
            : "No AI insights generated.",
        },
        {
          title: "Active Alerts Summary",
          body: `${criticalCount} critical, ${warningCount} warning, ${infoCount} info alerts active. ${criticalCount > 0 ? `${criticalCount} critical alert(s) require immediate escalation and executive attention.` : "No critical alerts at this time."} Total active alerts: ${alerts.length}.`,
        },
        {
          title: "Projected Downtime Risk",
          body: `Estimated ${totalDowntimeRisk} hours of potential downtime across ${predictions.filter((p) => p.failure_probability > 0.4).length} high-risk assets. Estimated financial impact: $${(totalDowntimeRisk * 8500).toLocaleString()} (at $8,500/hr estimated cost of downtime). Recommended action: Prioritize maintenance scheduling for top 3 risk assets within the next 7 days.`,
        },
      ],
      metrics: {
        "Plant Health": `${plant.health_score}%`,
        "Assets Monitored": assets.length,
        "Active Alerts": alerts.length,
        "Critical Alerts": criticalCount,
        "Warning Alerts": warningCount,
        "Info Alerts": infoCount,
        "Critical Assets": critical.length,
        "Avg Asset Health": `${avgHealth}%`,
        "Top Risk Probability": topRisk ? `${(topRisk.failure_probability * 100).toFixed(1)}%` : "N/A",
        "Projected Downtime Risk": `${totalDowntimeRisk} hours`,
      },
      recommendations: [
        ...(criticalCount > 0 ? [`IMMEDIATE: Escalate and resolve ${criticalCount} critical alert(s) within 2 hours`] : []),
        ...(topRiskAsset ? [`PRIORITY: Schedule emergency inspection for ${topRiskAsset.name} — failure probability ${(topRisk!.failure_probability * 100).toFixed(1)}%`] : []),
        ...insights
          .filter((i) => i.priority >= 3)
          .map((i) => i.summary)
          .slice(0, 5),
        "REVIEW: Conduct weekly executive review of asset health trends",
      ],
    },
    generated_by: "MAN OF STEEL Agent System",
    pdf_path: null,
  };
}
