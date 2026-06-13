export * from "./database";

export const MACHINE_TYPE_LABELS: Record<string, string> = {
  rolling_mill: "Rolling Mill",
  blast_furnace_fan: "Blast Furnace Fan",
  hydraulic_pump: "Hydraulic Pump",
  conveyor: "Conveyor",
  overhead_crane: "Overhead Crane",
  gearbox: "Gearbox",
  compressor: "Compressor",
  cooling_water_pump: "Cooling Water Pump",
  id_fan: "ID Fan",
  fd_fan: "FD Fan",
  bearing: "Bearing Assembly",
  drive_system: "Drive System",
};

export const MACHINE_TYPE_ICONS: Record<string, string> = {
  rolling_mill: "Cylinder",
  blast_furnace_fan: "Fan",
  hydraulic_pump: "Droplets",
  conveyor: "ArrowRightLeft",
  overhead_crane: "Construction",
  gearbox: "Settings2",
  compressor: "Wind",
  cooling_water_pump: "Water",
  id_fan: "Fan",
  fd_fan: "Fan",
  bearing: "CircleDot",
  drive_system: "Zap",
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

export const PRIORITY_LEVEL_LABELS: Record<string, string> = {
  p1_critical: "P1 — Critical",
  p2_high: "P2 — High",
  p3_medium: "P3 — Medium",
  p4_low: "P4 — Low",
};

export const PRIORITY_LEVEL_COLORS: Record<string, string> = {
  p1_critical: "text-destructive",
  p2_high: "text-warning",
  p3_medium: "text-accent",
  p4_low: "text-muted-foreground",
};

export const ENGINEER_FEEDBACK_LABELS: Record<string, string> = {
  correct: "Correct",
  partially_correct: "Partially Correct",
  incorrect: "Incorrect",
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
    href: "/maintenance-priority",
    label: "Maintenance Priority",
    icon: "ListChecks",
    description: "Rank assets by maintenance urgency",
  },
  {
    href: "/ai-copilot",
    label: "AI Copilot",
    icon: "Bot",
    description: "Multi-agent maintenance intelligence",
  },
  {
    href: "/maintenance-intelligence",
    label: "Intelligence",
    icon: "Activity",
    description: "Early warnings, bottlenecks, risks",
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
  evidence?: string[];
  sensorJustification?: Record<string, string>;
  reasoningSummary?: string;
}

export interface PriorityData {
  assetId: string;
  assetName: string;
  machineType: string;
  priorityScore: number;
  priorityLevel: import("./database").PriorityLevel;
  failureRisk: number;
  remainingUsefulLifeHours: number;
  processCriticality: number;
  productionImpact: number;
  spareAvailability: number;
  procurementLeadTimeDays: number;
  maintenanceWindow: string;
  procurementRecommendation: string;
  businessImpactSummary: string;
  healthScore: number;
  riskLevel: import("./database").RiskLevel;
}

export interface FeedbackInsights {
  totalFeedback: number;
  correctCount: number;
  partiallyCorrectCount: number;
  incorrectCount: number;
  accuracyRate: number;
  recurringIncidents: Array<{
    incidentType: string;
    count: number;
  }>;
  topRootCauses: Array<{
    rootCause: string;
    count: number;
  }>;
}

export interface PlantIntelligence {
  earlyWarnings: import("./database").EarlyWarning[];
  bottlenecks: import("./database").PlantBottleneck[];
  spareShortages: import("./database").SpareShortage[];
  riskEscalations: Array<{
    assetId: string;
    assetName: string;
    previousRisk: import("./database").RiskLevel;
    currentRisk: import("./database").RiskLevel;
    reason: string;
  }>;
  backlogRanking: Array<{
    assetId: string;
    assetName: string;
    overdueHours: number;
    priority: import("./database").PriorityLevel;
  }>;
  plantHealthRanking: Array<{
    assetId: string;
    assetName: string;
    healthScore: number;
    trend: "improving" | "declining" | "stable";
  }>;
}
