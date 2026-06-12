export * from "./database";

export const MACHINE_TYPE_LABELS: Record<string, string> = {
  rolling_mill: "Rolling Mill",
  blast_furnace_fan: "Blast Furnace Fan",
  hydraulic_pump: "Hydraulic Pump",
  conveyor: "Conveyor",
  overhead_crane: "Overhead Crane",
};

export const MACHINE_TYPE_ICONS: Record<string, string> = {
  rolling_mill: "Cylinder",
  blast_furnace_fan: "Fan",
  hydraulic_pump: "Droplets",
  conveyor: "ArrowRightLeft",
  overhead_crane: "Construction",
};

export const STATUS_LABELS: Record<string, string> = {
  operational: "Operational",
  degraded: "Degraded",
  critical: "Critical",
  offline: "Offline",
  maintenance: "Maintenance",
};

export const RISK_LABELS: Record<string, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical Risk",
};

export const SEVERITY_LABELS: Record<string, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

export const NAV_ITEMS = [
  {
    href: "/mission-control",
    label: "Mission Control",
    icon: "LayoutDashboard",
    description: "Plant-wide intelligence overview",
  },
  {
    href: "/asset-explorer",
    label: "Asset Explorer",
    icon: "Factory",
    description: "Deep-dive asset diagnostics",
  },
  {
    href: "/ai-copilot",
    label: "AI Copilot",
    icon: "Bot",
    description: "Multi-agent maintenance intelligence",
  },
  {
    href: "/reports",
    label: "Reports Center",
    icon: "FileText",
    description: "Generate and export reports",
  },
  {
    href: "/knowledge-vault",
    label: "Knowledge Vault",
    icon: "BookOpen",
    description: "Manuals, SOPs, and semantic search",
  },
] as const;

export interface RootCauseItem {
  assetName: string;
  assetId: string;
  likelyCause: string;
  confidence: number;
  evidence: string[];
  failureProbability: number;
}

export interface ExecutiveInsights {
  topRiskAsset: { name: string; probability: number } | null;
  topRiskValue: number;
  mostImprovedAsset: string;
  immediateAttentionAsset: { name: string; health: number };
  projectedDowntimeRisk: number;
  avgHealthScore: number;
}

export interface MissionControlData {
  plant: import("./database").Plant;
  healthScore: number;
  activeAlerts: number;
  criticalAssets: import("./database").Asset[];
  failureForecasts: import("./database").FailurePrediction[];
  insights: import("./database").AIInsight[];
  recentAlerts: import("./database").AlertWithAsset[];
  rootCauses: RootCauseItem[];
  executiveInsights: ExecutiveInsights;
}

export interface AgentDecision {
  rootCause: string;
  riskLevel: import("./database").RiskLevel;
  recommendedActions: string[];
  businessImpact: string;
  executiveSummary: string;
  citations: import("./database").Citation[];
  prediction: PredictionResult | null;
  agentsInvoked: string[];
  durationMs?: number;
}

export interface PredictionResult {
  failureProbability: number;
  remainingUsefulLifeHours: number;
  predictedFailureMode: string;
  confidence: number;
  riskLevel: import("./database").RiskLevel;
  features: Record<string, number>;
}
