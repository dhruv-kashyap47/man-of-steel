-- MAN OF STEEL — Industrial Maintenance Intelligence Platform
-- Initial schema with pgvector for RAG embeddings

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE machine_type AS ENUM (
  'rolling_mill',
  'blast_furnace_fan',
  'hydraulic_pump',
  'conveyor',
  'overhead_crane'
);

CREATE TYPE asset_status AS ENUM (
  'operational',
  'degraded',
  'critical',
  'offline',
  'maintenance'
);

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved');

CREATE TYPE maintenance_type AS ENUM (
  'preventive',
  'corrective',
  'predictive',
  'emergency'
);

CREATE TYPE document_type AS ENUM (
  'manual',
  'sop',
  'incident_report',
  'maintenance_log'
);

CREATE TYPE report_type AS ENUM (
  'incident',
  'maintenance',
  'executive_summary'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE insight_type AS ENUM (
  'prediction',
  'anomaly',
  'recommendation',
  'trend'
);

-- ─── Plants ──────────────────────────────────────────────────────────────────

CREATE TABLE plants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,
  capacity    TEXT,
  health_score NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Assets ──────────────────────────────────────────────────────────────────

CREATE TABLE assets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id          UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  machine_type      machine_type NOT NULL,
  serial_number     TEXT NOT NULL UNIQUE,
  status            asset_status NOT NULL DEFAULT 'operational',
  health_score      NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  location_zone     TEXT NOT NULL,
  manufacturer      TEXT,
  model             TEXT,
  install_date      DATE,
  operating_hours   NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_maintenance  TIMESTAMPTZ,
  failure_probability NUMERIC(5,4) DEFAULT 0 CHECK (failure_probability BETWEEN 0 AND 1),
  remaining_useful_life_hours NUMERIC(10,2),
  risk_level        risk_level NOT NULL DEFAULT 'low',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_plant_id ON assets(plant_id);
CREATE INDEX idx_assets_machine_type ON assets(machine_type);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_health_score ON assets(health_score);

-- ─── Sensor Readings (time-series) ───────────────────────────────────────────

CREATE TABLE sensor_readings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  recorded_at     TIMESTAMPTZ NOT NULL,
  temperature_c   NUMERIC(8,2) NOT NULL,
  pressure_bar    NUMERIC(8,2) NOT NULL,
  rpm             NUMERIC(10,2) NOT NULL,
  vibration_mm_s  NUMERIC(8,4) NOT NULL,
  operating_hours NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sensor_readings_asset_id ON sensor_readings(asset_id);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);
CREATE INDEX idx_sensor_readings_asset_time ON sensor_readings(asset_id, recorded_at DESC);

-- ─── Alerts ──────────────────────────────────────────────────────────────────

CREATE TABLE alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id      UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  severity      alert_severity NOT NULL,
  status        alert_status NOT NULL DEFAULT 'active',
  sensor_metric TEXT,
  threshold     NUMERIC(10,4),
  actual_value  NUMERIC(10,4),
  acknowledged_at TIMESTAMPTZ,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_asset_id ON alerts(asset_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ─── Maintenance Records ─────────────────────────────────────────────────────

CREATE TABLE maintenance_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  technician      TEXT,
  parts_replaced  TEXT[],
  downtime_hours  NUMERIC(8,2) DEFAULT 0,
  cost_usd        NUMERIC(12,2),
  performed_at    TIMESTAMPTZ NOT NULL,
  next_due_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_asset_id ON maintenance_records(asset_id);
CREATE INDEX idx_maintenance_performed_at ON maintenance_records(performed_at DESC);

-- ─── Failure Predictions ─────────────────────────────────────────────────────

CREATE TABLE failure_predictions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id              UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  failure_probability   NUMERIC(5,4) NOT NULL CHECK (failure_probability BETWEEN 0 AND 1),
  remaining_useful_life_hours NUMERIC(10,2) NOT NULL,
  predicted_failure_mode TEXT,
  confidence            NUMERIC(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  model_version         TEXT NOT NULL DEFAULT 'v1.0',
  input_features        JSONB NOT NULL DEFAULT '{}',
  predicted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_asset_id ON failure_predictions(asset_id);
CREATE INDEX idx_predictions_predicted_at ON failure_predictions(predicted_at DESC);

-- ─── AI Insights (Mission Control) ───────────────────────────────────────────

CREATE TABLE ai_insights (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id    UUID REFERENCES plants(id) ON DELETE CASCADE,
  asset_id    UUID REFERENCES assets(id) ON DELETE CASCADE,
  insight_type insight_type NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  impact      TEXT,
  priority    INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

CREATE INDEX idx_insights_plant_id ON ai_insights(plant_id);
CREATE INDEX idx_insights_asset_id ON ai_insights(asset_id);
CREATE INDEX idx_insights_created_at ON ai_insights(created_at DESC);

-- ─── Knowledge Documents (RAG) ───────────────────────────────────────────────

CREATE TABLE knowledge_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  document_type document_type NOT NULL,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL CHECK (file_type IN ('pdf', 'markdown', 'text')),
  content       TEXT NOT NULL,
  asset_id      UUID REFERENCES assets(id) ON DELETE SET NULL,
  machine_type  machine_type,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_doc_type ON knowledge_documents(document_type);
CREATE INDEX idx_knowledge_machine_type ON knowledge_documents(machine_type);
CREATE INDEX idx_knowledge_asset_id ON knowledge_documents(asset_id);

-- ─── Document Chunks (pgvector embeddings) ───────────────────────────────────

CREATE TABLE document_chunks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  embedding     vector(1536),
  token_count   INTEGER,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);

-- HNSW index for fast semantic search (cosine similarity)
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── Semantic search function ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 8,
  filter_machine_type machine_type DEFAULT NULL,
  filter_document_type document_type DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INTEGER,
  similarity FLOAT,
  document_title TEXT,
  document_type document_type,
  machine_type machine_type,
  file_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    kd.title AS document_title,
    kd.document_type,
    kd.machine_type,
    kd.file_name
  FROM document_chunks dc
  JOIN knowledge_documents kd ON kd.id = dc.document_id
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_machine_type IS NULL OR kd.machine_type = filter_machine_type)
    AND (filter_document_type IS NULL OR kd.document_type = filter_document_type)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── Copilot Conversations ───────────────────────────────────────────────────

CREATE TABLE copilot_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL DEFAULT 'New Investigation',
  asset_id    UUID REFERENCES assets(id) ON DELETE SET NULL,
  context     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_asset_id ON copilot_conversations(asset_id);
CREATE INDEX idx_conversations_updated_at ON copilot_conversations(updated_at DESC);

-- ─── Copilot Messages ────────────────────────────────────────────────────────

CREATE TABLE copilot_messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT NOT NULL,
  agent_name        TEXT,
  citations         JSONB NOT NULL DEFAULT '[]',
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON copilot_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON copilot_messages(created_at);

-- ─── Reports ───────────────────────────────────────────────────────────────────

CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type   report_type NOT NULL,
  title         TEXT NOT NULL,
  asset_id      UUID REFERENCES assets(id) ON DELETE SET NULL,
  plant_id      UUID REFERENCES plants(id) ON DELETE SET NULL,
  content       JSONB NOT NULL DEFAULT '{}',
  pdf_path      TEXT,
  generated_by  TEXT NOT NULL DEFAULT 'system',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_asset_id ON reports(asset_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ─── Agent Run Logs ──────────────────────────────────────────────────────────

CREATE TABLE agent_runs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES copilot_conversations(id) ON DELETE SET NULL,
  asset_id        UUID REFERENCES assets(id) ON DELETE SET NULL,
  workflow        TEXT NOT NULL,
  agents_invoked  TEXT[] NOT NULL DEFAULT '{}',
  input_query     TEXT NOT NULL,
  output_summary  TEXT,
  evidence        JSONB NOT NULL DEFAULT '{}',
  duration_ms     INTEGER,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_asset_id ON agent_runs(asset_id);
CREATE INDEX idx_agent_runs_created_at ON agent_runs(created_at DESC);

-- ─── Updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plants_updated_at
  BEFORE UPDATE ON plants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_knowledge_updated_at
  BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON copilot_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security (public read for hackathon demo, no auth) ────────────

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Open policies for anon access (no auth hackathon mode)
CREATE POLICY "public_read_plants" ON plants FOR SELECT USING (true);
CREATE POLICY "public_read_assets" ON assets FOR SELECT USING (true);
CREATE POLICY "public_read_sensor_readings" ON sensor_readings FOR SELECT USING (true);
CREATE POLICY "public_read_alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "public_read_maintenance" ON maintenance_records FOR SELECT USING (true);
CREATE POLICY "public_read_predictions" ON failure_predictions FOR SELECT USING (true);
CREATE POLICY "public_read_insights" ON ai_insights FOR SELECT USING (true);
CREATE POLICY "public_read_knowledge" ON knowledge_documents FOR SELECT USING (true);
CREATE POLICY "public_read_chunks" ON document_chunks FOR SELECT USING (true);
CREATE POLICY "public_read_conversations" ON copilot_conversations FOR SELECT USING (true);
CREATE POLICY "public_read_messages" ON copilot_messages FOR SELECT USING (true);
CREATE POLICY "public_read_reports" ON reports FOR SELECT USING (true);
CREATE POLICY "public_read_agent_runs" ON agent_runs FOR SELECT USING (true);

CREATE POLICY "public_insert_conversations" ON copilot_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_messages" ON copilot_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_knowledge" ON knowledge_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_chunks" ON document_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_agent_runs" ON agent_runs FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update_conversations" ON copilot_conversations FOR UPDATE USING (true);
CREATE POLICY "public_update_alerts" ON alerts FOR UPDATE USING (true);

-- Service role bypasses RLS; anon can read/write demo data
