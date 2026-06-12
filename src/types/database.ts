export type MachineType =
  | "rolling_mill"
  | "blast_furnace_fan"
  | "hydraulic_pump"
  | "conveyor"
  | "overhead_crane";

export type AssetStatus =
  | "operational"
  | "degraded"
  | "critical"
  | "offline"
  | "maintenance";

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertStatus = "active" | "acknowledged" | "resolved";

export type MaintenanceType =
  | "preventive"
  | "corrective"
  | "predictive"
  | "emergency";

export type DocumentType =
  | "manual"
  | "sop"
  | "incident_report"
  | "maintenance_log";

export type ReportType = "incident" | "maintenance" | "executive_summary";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type InsightType = "prediction" | "anomaly" | "recommendation" | "trend";

export interface Plant {
  id: string;
  name: string;
  location: string;
  capacity: string | null;
  health_score: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  plant_id: string;
  name: string;
  machine_type: MachineType;
  serial_number: string;
  status: AssetStatus;
  health_score: number;
  location_zone: string;
  manufacturer: string | null;
  model: string | null;
  install_date: string | null;
  operating_hours: number;
  last_maintenance: string | null;
  failure_probability: number | null;
  remaining_useful_life_hours: number | null;
  risk_level: RiskLevel;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id: string;
  asset_id: string;
  recorded_at: string;
  temperature_c: number;
  pressure_bar: number;
  rpm: number;
  vibration_mm_s: number;
  operating_hours: number;
  created_at: string;
}

export interface Alert {
  id: string;
  asset_id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  sensor_metric: string | null;
  threshold: number | null;
  actual_value: number | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  asset_id: string;
  maintenance_type: MaintenanceType;
  title: string;
  description: string;
  technician: string | null;
  parts_replaced: string[] | null;
  downtime_hours: number | null;
  cost_usd: number | null;
  performed_at: string;
  next_due_at: string | null;
  created_at: string;
}

export interface FailurePrediction {
  id: string;
  asset_id: string;
  failure_probability: number;
  remaining_useful_life_hours: number;
  predicted_failure_mode: string | null;
  confidence: number;
  model_version: string;
  input_features: Record<string, number>;
  predicted_at: string;
  created_at: string;
}

export interface AIInsight {
  id: string;
  plant_id: string | null;
  asset_id: string | null;
  insight_type: InsightType;
  title: string;
  summary: string;
  impact: string | null;
  priority: number;
  metadata: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  document_type: DocumentType;
  file_name: string;
  file_type: "pdf" | "markdown" | "text";
  content: string;
  asset_id: string | null;
  machine_type: MachineType | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  token_count: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CopilotConversation {
  id: string;
  title: string;
  asset_id: string | null;
  context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CopilotMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent_name: string | null;
  citations: Citation[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Report {
  id: string;
  report_type: ReportType;
  title: string;
  asset_id: string | null;
  plant_id: string | null;
  content: Record<string, unknown>;
  pdf_path: string | null;
  generated_by: string;
  created_at: string;
}

export interface AgentRun {
  id: string;
  conversation_id: string | null;
  asset_id: string | null;
  workflow: string;
  agents_invoked: string[];
  input_query: string;
  output_summary: string | null;
  evidence: Record<string, unknown>;
  duration_ms: number | null;
  status: "running" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
}

export interface Citation {
  document_id: string;
  document_title: string;
  document_type: DocumentType;
  chunk_index: number;
  content_snippet: string;
  similarity: number;
}

export interface MatchedChunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  similarity: number;
  document_title: string;
  document_type: DocumentType;
  machine_type: MachineType | null;
  file_name: string;
}

export interface AssetWithPlant extends Asset {
  plant?: Plant;
}

export interface AlertWithAsset extends Alert {
  asset?: Asset;
}

export interface Database {
  public: {
    Tables: {
      plants: { Row: Plant; Insert: Partial<Plant>; Update: Partial<Plant> };
      assets: { Row: Asset; Insert: Partial<Asset>; Update: Partial<Asset> };
      sensor_readings: {
        Row: SensorReading;
        Insert: Partial<SensorReading>;
        Update: Partial<SensorReading>;
      };
      alerts: { Row: Alert; Insert: Partial<Alert>; Update: Partial<Alert> };
      maintenance_records: {
        Row: MaintenanceRecord;
        Insert: Partial<MaintenanceRecord>;
        Update: Partial<MaintenanceRecord>;
      };
      failure_predictions: {
        Row: FailurePrediction;
        Insert: Partial<FailurePrediction>;
        Update: Partial<FailurePrediction>;
      };
      ai_insights: {
        Row: AIInsight;
        Insert: Partial<AIInsight>;
        Update: Partial<AIInsight>;
      };
      knowledge_documents: {
        Row: KnowledgeDocument;
        Insert: Partial<KnowledgeDocument>;
        Update: Partial<KnowledgeDocument>;
      };
      document_chunks: {
        Row: DocumentChunk;
        Insert: Partial<DocumentChunk>;
        Update: Partial<DocumentChunk>;
      };
      copilot_conversations: {
        Row: CopilotConversation;
        Insert: Partial<CopilotConversation>;
        Update: Partial<CopilotConversation>;
      };
      copilot_messages: {
        Row: CopilotMessage;
        Insert: Partial<CopilotMessage>;
        Update: Partial<CopilotMessage>;
      };
      reports: {
        Row: Report;
        Insert: Partial<Report>;
        Update: Partial<Report>;
      };
      agent_runs: {
        Row: AgentRun;
        Insert: Partial<AgentRun>;
        Update: Partial<AgentRun>;
      };
    };
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_machine_type?: MachineType | null;
          filter_document_type?: DocumentType | null;
        };
        Returns: MatchedChunk[];
      };
    };
  };
}
