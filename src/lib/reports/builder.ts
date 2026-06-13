import { dataStore } from "@/lib/data/store";
import type { ReportType, PriorityLevel } from "@/types/database";

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

export function buildPriorityReport() {
  const priorities = dataStore.getPriorities();
  const assets = dataStore.getAssets();

  const p1Count = priorities.filter((p) => p.priority_level === "p1_critical").length;
  const p2Count = priorities.filter((p) => p.priority_level === "p2_high").length;
  const p3Count = priorities.filter((p) => p.priority_level === "p3_medium").length;
  const p4Count = priorities.filter((p) => p.priority_level === "p4_low").length;

  const avgProcurementLead = Math.round(
    priorities.reduce((s, p) => s + p.procurement_lead_time_days, 0) / priorities.length
  );

  const bottlenecks = dataStore.getBottlenecks();
  const shortages = dataStore.getSpareShortages();

  return {
    report_type: "priority" as ReportType,
    title: `Maintenance Priority Report — ${assets.length} Assets`,
    asset_id: null,
    plant_id: assets[0]?.plant_id ?? null,
    content: {
      executiveSummary: `Priority assessment for ${assets.length} assets. ${p1Count} P1-Critical, ${p2Count} P2-High, ${p3Count} P3-Medium, ${p4Count} P4-Low. ${bottlenecks.length} production bottlenecks identified. ${shortages.length} spare shortages requiring attention.`,
      sections: [
        {
          title: "Priority Distribution",
          body: `P1 Critical: ${p1Count} assets requiring immediate action within 24 hours.\nP2 High: ${p2Count} assets requiring intervention within 7 days.\nP3 Medium: ${p3Count} assets — schedule during next planned shutdown.\nP4 Low: ${p4Count} assets — continue routine monitoring.`,
        },
        {
          title: "Top 5 Critical Assets",
          body: priorities
            .filter((p) => p.priority_level === "p1_critical" || p.priority_level === "p2_high")
            .slice(0, 5)
            .map((p) => {
              const asset = assets.find((a) => a.id === p.asset_id);
              return `• ${asset?.name ?? "Unknown"} (${p.priority_level})\n  Score: ${p.priority_score}/100 | RUL: ${p.remaining_useful_life_hours.toLocaleString()}h | Window: ${p.maintenance_window}\n  Procurement: ${p.procurement_recommendation}`;
            })
            .join("\n\n"),
        },
        {
          title: "Production Bottlenecks",
          body: bottlenecks.length > 0
            ? bottlenecks.map((b) => {
                const asset = assets.find((a) => a.id === b.asset_id);
                return `• ${b.bottleneck_type} (${b.severity})\n  Asset: ${asset?.name ?? "Unknown"}\n  Impact: ${b.production_impact_description}\n  Estimated cost: $${b.estimated_cost_usd.toLocaleString()}`;
              }).join("\n\n")
            : "No production bottlenecks identified.",
        },
        {
          title: "Spare Parts Shortages",
          body: shortages.length > 0
            ? shortages.map((s) => `• ${s.part_name}\n  Stock: ${s.current_stock}/${s.reorder_point} | Lead: ${s.lead_time_days} days\n  Priority: ${s.priority}\n  Impact: ${s.impact_description}`).join("\n\n")
            : "No spare shortages at this time.",
        },
        {
          title: "Procurement Risk Analysis",
          body: `Average procurement lead time: ${avgProcurementLead} days.\n\nAssets with lead time > 60 days:\n${priorities
            .filter((p) => p.procurement_lead_time_days > 60)
            .map((p) => {
              const asset = assets.find((a) => a.id === p.asset_id);
              return `• ${asset?.name ?? "Unknown"}: ${p.procurement_lead_time_days} days — ${p.procurement_recommendation}`;
            })
            .join("\n") || "None"}`,
        },
      ],
      metrics: {
        "Total Assets": assets.length,
        "P1 Critical": p1Count,
        "P2 High": p2Count,
        "P3 Medium": p3Count,
        "P4 Low": p4Count,
        "Bottlenecks": bottlenecks.length,
        "Spare Shortages": shortages.length,
        "Avg Procurement Lead": `${avgProcurementLead} days`,
        "Top Priority Score": `${priorities[0]?.priority_score ?? 0}/100`,
      },
      recommendations: [
        ...(p1Count > 0 ? [`IMMEDIATE: Resolve ${p1Count} P1 critical assets within 24 hours`] : []),
        ...(bottlenecks.length > 0 ? [`PRIORITY: Address ${bottlenecks.length} production bottlenecks impacting throughput`] : []),
        ...(shortages.length > 0 ? [`URGENT: Order critical spares — ${shortages.length} items below reorder point`] : []),
        "REVIEW: Conduct weekly priority review for all assets",
        "UPDATE: Reassess process criticality for long-lead-time assets",
      ],
    },
    generated_by: "MAN OF STEEL Priority Engine",
    pdf_path: null,
  };
}

export function buildFeedbackLearningReport() {
  const insights = dataStore.getFeedbackInsights();
  const feedback = dataStore.getFeedback();
  const experiences = dataStore.getExperiences();

  return {
    report_type: "feedback_learning" as ReportType,
    title: `Feedback Learning Report — ${insights.totalFeedback} Cases`,
    asset_id: null,
    plant_id: null,
    content: {
      executiveSummary: `Learning engine analyzed ${insights.totalFeedback} feedback cases. Accuracy rate: ${(insights.accuracyRate * 100).toFixed(0)}%. ${insights.correctCount} correct, ${insights.partiallyCorrectCount} partially correct, ${insights.incorrectCount} incorrect. ${experiences.length} total experience nodes.`,
      sections: [
        {
          title: "Model Accuracy Overview",
          body: `Total feedback cases: ${insights.totalFeedback}
Correct predictions: ${insights.correctCount} (${(insights.correctCount / Math.max(1, insights.totalFeedback) * 100).toFixed(0)}%)
Partially correct: ${insights.partiallyCorrectCount} (${(insights.partiallyCorrectCount / Math.max(1, insights.totalFeedback) * 100).toFixed(0)}%)
Incorrect: ${insights.incorrectCount} (${(insights.incorrectCount / Math.max(1, insights.totalFeedback) * 100).toFixed(0)}%)
Accuracy rate: ${(insights.accuracyRate * 100).toFixed(0)}%`,
        },
        {
          title: "Recurring Incident Types",
          body: insights.recurringIncidents.length > 0
            ? insights.recurringIncidents.map((ri) => `• ${ri.incidentType}: ${ri.count} occurrences`).join("\n")
            : "No recurring incidents documented.",
        },
        {
          title: "Top Root Causes (from engineer feedback)",
          body: insights.topRootCauses.length > 0
            ? insights.topRootCauses.map((rc) => `• ${rc.rootCause}: ${rc.count} cases`).join("\n")
            : "No root cause data available.",
        },
        {
          title: "Recent Feedback Entries",
          body: feedback.slice(0, 5).map((f) => {
            const date = new Date(f.timestamp).toLocaleDateString();
            return `[${date}] ${f.query}\n  Actual: ${f.actual_outcome.slice(0, 80)}...\n  Feedback: ${f.engineer_feedback}`;
          }).join("\n\n"),
        },
      ],
      metrics: {
        "Total Feedback": insights.totalFeedback,
        "Accuracy Rate": `${(insights.accuracyRate * 100).toFixed(0)}%`,
        "Experience Nodes": experiences.length,
        "Recurring Fault Types": insights.recurringIncidents.length,
        "Root Causes Tracked": insights.topRootCauses.length,
        "Learning Progress": experiences.length > 0
          ? `${Math.round((experiences.filter((e) => e.fix_effective).length / experiences.length) * 100)}%`
          : "N/A",
      },
      recommendations: [
        ...(insights.accuracyRate < 0.6 ? ["PRIORITY: Retrain prediction model — accuracy below 60% threshold"] : []),
        ...(insights.incorrectCount > 0 ? [`REVIEW: Analyze ${insights.incorrectCount} incorrect predictions for pattern`] : []),
        "CONTINUE: Maintain feedback loop for continuous model improvement",
        "ENHANCE: Add more experience nodes for rare failure modes",
      ],
    },
    generated_by: "MAN OF STEEL Learning Engine",
    pdf_path: null,
  };
}

export function buildMaintenanceIntelligenceReport() {
  const intel = dataStore.getIntelligence();
  const assets = dataStore.getAssets();

  const avgHealth = (assets.reduce((s, a) => s + a.health_score, 0) / assets.length).toFixed(1);
  const riskyAssets = intel.riskEscalations.length;
  const totalWarningCost = intel.bottlenecks.reduce((s, b) => s + b.estimated_cost_usd, 0);

  return {
    report_type: "intelligence" as ReportType,
    title: `Maintenance Intelligence Report — Plant Health Status`,
    asset_id: null,
    plant_id: assets[0]?.plant_id ?? null,
    content: {
      executiveSummary: `Real-time intelligence summary. ${intel.earlyWarnings.length} early warnings active. ${intel.bottlenecks.length} production bottlenecks ($${totalWarningCost.toLocaleString()} total risk). ${intel.spareShortages.length} spare shortages. ${riskyAssets} risk escalations. Average asset health: ${avgHealth}%.`,
      sections: [
        {
          title: "Early Failure Warnings",
          body: intel.earlyWarnings.length > 0
            ? intel.earlyWarnings.map((w) => {
                const asset = assets.find((a) => a.id === w.asset_id);
                return `• [${w.severity.toUpperCase()}] ${w.warning_type}\n  Asset: ${asset?.name ?? "Unknown"} | Confidence: ${(w.confidence * 100).toFixed(0)}%\n  ${w.description}`;
              }).join("\n\n")
            : "No early warnings at this time.",
        },
        {
          title: "Risk Escalations",
          body: intel.riskEscalations.length > 0
            ? intel.riskEscalations.map((r) => `• ${r.assetName}: ${r.previousRisk} → ${r.currentRisk}\n  ${r.reason}`).join("\n\n")
            : "No risk escalations.",
        },
        {
          title: "Production Bottlenecks",
          body: intel.bottlenecks.length > 0
            ? intel.bottlenecks.map((b) => {
                const asset = assets.find((a) => a.id === b.asset_id);
                return `• ${b.bottleneck_type} (${b.severity})\n  ${b.description}\n  Downtime: ${b.estimated_downtime_hours}h | Cost: $${b.estimated_cost_usd.toLocaleString()}`;
              }).join("\n\n")
            : "No bottlenecks identified.",
        },
        {
          title: "Spare Shortages",
          body: intel.spareShortages.length > 0
            ? intel.spareShortages.map((s) => `• ${s.part_name} — Stock: ${s.current_stock} (reorder at ${s.reorder_point})\n  Lead: ${s.lead_time_days} days | Priority: ${s.priority}\n  ${s.impact_description}`).join("\n\n")
            : "No spare shortages.",
        },
        {
          title: "Plant Health Ranking",
          body: intel.plantHealthRanking.slice(0, 5).map((r) => `• ${r.assetName}: ${r.healthScore}% (${r.trend})`).join("\n"),
        },
      ],
      metrics: {
        "Early Warnings": intel.earlyWarnings.length,
        "Production Bottlenecks": intel.bottlenecks.length,
        "Spare Shortages": intel.spareShortages.length,
        "Risk Escalations": riskyAssets,
        "Backlog Items": intel.backlogRanking.length,
        "Average Health": `${avgHealth}%`,
        "Total Bottleneck Cost": `$${totalWarningCost.toLocaleString()}`,
      },
      recommendations: [
        ...(intel.earlyWarnings.some((w) => w.severity === "critical") ? ["IMMEDIATE: Address critical early warnings — catastrophic failure risk"] : []),
        ...(intel.bottlenecks.length > 0 ? ["PRIORITY: Resolve production bottlenecks to restore throughput"] : []),
        ...(intel.spareShortages.some((s) => s.priority === "p1_critical") ? ["URGENT: Order critical spares with zero stock"] : []),
        "MONITOR: Track asset health trends weekly",
        "REVIEW: Conduct bottleneck analysis for top 3 constraints",
      ],
    },
    generated_by: "MAN OF STEEL Intelligence Engine",
    pdf_path: null,
  };
}
