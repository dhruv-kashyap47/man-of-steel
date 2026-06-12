import { v4 as uuidv4 } from "uuid";
import {
  generatePlant,
  generateAssets,
  generateSensorReadings,
  generateAlerts,
  generateMaintenanceRecords,
  generatePredictions,
  generateInsights,
} from "./generators";
import { KNOWLEDGE_DOCUMENTS } from "./knowledge-content";
import type {
  Plant,
  Asset,
  SensorReading,
  Alert,
  MaintenanceRecord,
  FailurePrediction,
  AIInsight,
  KnowledgeDocument,
  DocumentChunk,
  CopilotConversation,
  CopilotMessage,
  Report,
} from "@/types/database";

let initialized = false;
let plant: Plant;
let assets: Asset[] = [];
const sensorReadings: Map<string, SensorReading[]> = new Map();
let alerts: Alert[] = [];
let maintenanceRecords: MaintenanceRecord[] = [];
let predictions: FailurePrediction[] = [];
let insights: AIInsight[] = [];
let knowledgeDocs: KnowledgeDocument[] = [];
let documentChunks: DocumentChunk[] = [];
const conversations: CopilotConversation[] = [];
const messages: CopilotMessage[] = [];
const reports: Report[] = [];

function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize - overlap;
  }
  return chunks;
}

function init() {
  if (initialized) return;
  plant = generatePlant();
  assets = generateAssets(plant.id);
  assets.forEach((a) => sensorReadings.set(a.id, generateSensorReadings(a)));
  alerts = generateAlerts(assets);
  maintenanceRecords = generateMaintenanceRecords(assets);
  predictions = generatePredictions(assets);
  insights = generateInsights(plant.id, assets);
  const now = new Date().toISOString();
  knowledgeDocs = KNOWLEDGE_DOCUMENTS.map((doc) => ({
    id: uuidv4(),
    title: doc.title,
    document_type: doc.document_type,
    file_name: doc.file_name,
    file_type: doc.file_type,
    content: doc.content,
    asset_id: null,
    machine_type: doc.machine_type,
    tags: doc.tags,
    metadata: {},
    created_at: now,
    updated_at: now,
  }));
  documentChunks = knowledgeDocs.flatMap((doc) =>
    chunkText(doc.content).map((content, i) => ({
      id: uuidv4(),
      document_id: doc.id,
      chunk_index: i,
      content,
      embedding: null,
      token_count: Math.ceil(content.length / 4),
      metadata: { title: doc.title },
      created_at: now,
    }))
  );
  initialized = true;
}

export const dataStore = {
  getPlant(): Plant {
    init();
    return plant;
  },

  getAssets(): Asset[] {
    init();
    return assets;
  },

  getAsset(id: string): Asset | undefined {
    init();
    return assets.find((a) => a.id === id);
  },

  getSensorReadings(assetId: string): SensorReading[] {
    init();
    return sensorReadings.get(assetId) ?? [];
  },

  getAlerts(): Alert[] {
    init();
    return alerts;
  },

  getActiveAlerts(): Alert[] {
    init();
    return alerts.filter((a) => a.status === "active");
  },

  getMaintenanceRecords(assetId?: string): MaintenanceRecord[] {
    init();
    return assetId
      ? maintenanceRecords.filter((m) => m.asset_id === assetId)
      : maintenanceRecords;
  },

  getPredictions(): FailurePrediction[] {
    init();
    return predictions;
  },

  getPrediction(assetId: string): FailurePrediction | undefined {
    init();
    return predictions.find((p) => p.asset_id === assetId);
  },

  getInsights(): AIInsight[] {
    init();
    return insights;
  },

  getKnowledgeDocuments(): KnowledgeDocument[] {
    init();
    return knowledgeDocs;
  },

  getDocumentChunks(): DocumentChunk[] {
    init();
    return documentChunks;
  },

  addKnowledgeDocument(doc: Omit<KnowledgeDocument, "id" | "created_at" | "updated_at">): KnowledgeDocument {
    init();
    const now = new Date().toISOString();
    const newDoc: KnowledgeDocument = { ...doc, id: uuidv4(), created_at: now, updated_at: now };
    knowledgeDocs.push(newDoc);
    chunkText(doc.content).forEach((content, i) => {
      documentChunks.push({
        id: uuidv4(),
        document_id: newDoc.id,
        chunk_index: i,
        content,
        embedding: null,
        token_count: Math.ceil(content.length / 4),
        metadata: { title: doc.title },
        created_at: now,
      });
    });
    return newDoc;
  },

  getConversations(): CopilotConversation[] {
    init();
    return conversations;
  },

  getConversation(id: string): CopilotConversation | undefined {
    init();
    return conversations.find((c) => c.id === id);
  },

  createConversation(assetId?: string, title?: string): CopilotConversation {
    init();
    const now = new Date().toISOString();
    const conv: CopilotConversation = {
      id: uuidv4(),
      title: title ?? "New Investigation",
      asset_id: assetId ?? null,
      context: {},
      created_at: now,
      updated_at: now,
    };
    conversations.unshift(conv);
    return conv;
  },

  getMessages(conversationId: string): CopilotMessage[] {
    init();
    return messages.filter((m) => m.conversation_id === conversationId);
  },

  addMessage(msg: Omit<CopilotMessage, "id" | "created_at">): CopilotMessage {
    init();
    const newMsg: CopilotMessage = { ...msg, id: uuidv4(), created_at: new Date().toISOString() };
    messages.push(newMsg);
    const conv = conversations.find((c) => c.id === msg.conversation_id);
    if (conv) conv.updated_at = newMsg.created_at;
    return newMsg;
  },

  getReports(): Report[] {
    init();
    return reports;
  },

  addReport(report: Omit<Report, "id" | "created_at">): Report {
    init();
    const newReport: Report = { ...report, id: uuidv4(), created_at: new Date().toISOString() };
    reports.unshift(newReport);
    return newReport;
  },

  getCriticalAssets(): Asset[] {
    init();
    return assets
      .filter((a) => a.status === "critical" || a.status === "degraded")
      .sort((a, b) => a.health_score - b.health_score)
      .slice(0, 5);
  },
};
