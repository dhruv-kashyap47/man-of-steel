import { v4 as uuidv4 } from "uuid";
import {
  generatePlant,
  generateAssets,
  generateSensorReadings,
  generateAlerts,
  generateMaintenanceRecords,
  generatePredictions,
  generateInsights,
  generateMaintenancePriorities,
  generateFeedbackEntries,
  generateExperienceNodes,
  generateEarlyWarnings,
  generatePlantBottlenecks,
  generateSpareShortages,
  generateRiskEscalations,
  generateBacklogRanking,
  generatePlantHealthRanking,
} from "./generators";
import { KNOWLEDGE_DOCUMENTS } from "./knowledge-content";
import { embedTextLocal } from "@/lib/rag/embeddings";
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
  MaintenancePriority,
  MaintenanceFeedback,
  ExperienceNode,
  EarlyWarning,
  PlantBottleneck,
  SpareShortage,
} from "@/types/database";

const g = globalThis as typeof globalThis & {
  __init?: boolean;
  __plant?: Plant;
  __assets?: Asset[];
  __sensorReadings?: Map<string, SensorReading[]>;
  __alerts?: Alert[];
  __maintenanceRecords?: MaintenanceRecord[];
  __predictions?: FailurePrediction[];
  __insights?: AIInsight[];
  __knowledgeDocs?: KnowledgeDocument[];
  __documentChunks?: DocumentChunk[];
  __conversations?: CopilotConversation[];
  __messages?: CopilotMessage[];
  __reports?: Report[];
  __priorities?: MaintenancePriority[];
  __feedback?: MaintenanceFeedback[];
  __experiences?: ExperienceNode[];
  __earlyWarnings?: EarlyWarning[];
  __bottlenecks?: PlantBottleneck[];
  __spareShortages?: SpareShortage[];
};


let plant: Plant = g.__plant!;
let assets: Asset[] = g.__assets ?? (g.__assets = []);
const sensorReadings: Map<string, SensorReading[]> = g.__sensorReadings ?? (g.__sensorReadings = new Map());
let alerts: Alert[] = g.__alerts ?? (g.__alerts = []);
let maintenanceRecords: MaintenanceRecord[] = g.__maintenanceRecords ?? (g.__maintenanceRecords = []);
let predictions: FailurePrediction[] = g.__predictions ?? (g.__predictions = []);
let insights: AIInsight[] = g.__insights ?? (g.__insights = []);
let knowledgeDocs: KnowledgeDocument[] = g.__knowledgeDocs ?? (g.__knowledgeDocs = []);
let documentChunks: DocumentChunk[] = g.__documentChunks ?? (g.__documentChunks = []);
const conversations: CopilotConversation[] = g.__conversations ?? (g.__conversations = []);
const messages: CopilotMessage[] = g.__messages ?? (g.__messages = []);
const reports: Report[] = g.__reports ?? (g.__reports = []);
let priorities: MaintenancePriority[] = g.__priorities ?? (g.__priorities = []);
let feedback: MaintenanceFeedback[] = g.__feedback ?? (g.__feedback = []);
let experiences: ExperienceNode[] = g.__experiences ?? (g.__experiences = []);
let earlyWarnings: EarlyWarning[] = g.__earlyWarnings ?? (g.__earlyWarnings = []);
let bottlenecks: PlantBottleneck[] = g.__bottlenecks ?? (g.__bottlenecks = []);
let spareShortages: SpareShortage[] = g.__spareShortages ?? (g.__spareShortages = []);

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
  if (g.__init) return;
  plant = generatePlant();
  g.__plant = plant;
  assets = generateAssets(plant.id);
  g.__assets = assets;
  assets.forEach((a) => sensorReadings.set(a.id, generateSensorReadings(a)));
  alerts = generateAlerts(assets);
  g.__alerts = alerts;
  maintenanceRecords = generateMaintenanceRecords(assets);
  g.__maintenanceRecords = maintenanceRecords;
  predictions = generatePredictions(assets);
  g.__predictions = predictions;
  insights = generateInsights(plant.id, assets);
  g.__insights = insights;
  priorities = generateMaintenancePriorities(assets);
  g.__priorities = priorities;
  feedback = generateFeedbackEntries(assets);
  g.__feedback = feedback;
  experiences = generateExperienceNodes(assets);
  g.__experiences = experiences;
  earlyWarnings = generateEarlyWarnings(assets);
  g.__earlyWarnings = earlyWarnings;
  bottlenecks = generatePlantBottlenecks(assets);
  g.__bottlenecks = bottlenecks;
  spareShortages = generateSpareShortages();
  g.__spareShortages = spareShortages;
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
  g.__knowledgeDocs = knowledgeDocs;
  documentChunks = knowledgeDocs.flatMap((doc) =>
    chunkText(doc.content).map((content, i) => ({
      id: uuidv4(),
      document_id: doc.id,
      chunk_index: i,
      content,
      embedding: embedTextLocal(content),
      token_count: Math.ceil(content.length / 4),
      metadata: { title: doc.title },
      created_at: now,
    }))
  );
  g.__documentChunks = documentChunks;
  g.__init = true;
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
        embedding: embedTextLocal(content),
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

  getPriorities(): MaintenancePriority[] {
    init();
    return [...priorities].sort((a, b) => b.priority_score - a.priority_score);
  },

  getPriority(assetId: string): MaintenancePriority | undefined {
    init();
    return priorities.find((p) => p.asset_id === assetId);
  },

  getCriticalPriorities(): MaintenancePriority[] {
    init();
    return priorities
      .filter((p) => p.priority_level === "p1_critical" || p.priority_level === "p2_high")
      .sort((a, b) => b.priority_score - a.priority_score);
  },

  getFeedback(): MaintenanceFeedback[] {
    init();
    return [...feedback].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addFeedback(entry: Omit<MaintenanceFeedback, "id" | "created_at">): MaintenanceFeedback {
    init();
    const newEntry: MaintenanceFeedback = { ...entry, id: uuidv4(), created_at: new Date().toISOString() };
    feedback.unshift(newEntry);
    return newEntry;
  },

  getFeedbackInsights() {
    init();
    const total = feedback.length;
    const correctCount = feedback.filter((f) => f.engineer_feedback === "correct").length;
    const partiallyCorrectCount = feedback.filter((f) => f.engineer_feedback === "partially_correct").length;
    const incorrectCount = feedback.filter((f) => f.engineer_feedback === "incorrect").length;
    const accuracyRate = total > 0 ? correctCount / total : 0;

    const rootCauseCounts: Record<string, number> = {};
    feedback.forEach((f) => {
      rootCauseCounts[f.root_cause] = (rootCauseCounts[f.root_cause] ?? 0) + 1;
    });
    const topRootCauses = Object.entries(rootCauseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rootCause, count]) => ({ rootCause, count }));

    const empty: Array<{ incidentType: string; count: number }> = [];
    return {
      totalFeedback: total,
      correctCount,
      partiallyCorrectCount,
      incorrectCount,
      accuracyRate: Math.round(accuracyRate * 10000) / 10000,
      recurringIncidents: empty,
      topRootCauses,
    };
  },

  getExperiences(): ExperienceNode[] {
    init();
    return [...experiences].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findSimilarExperiences(query: string, limit = 5): ExperienceNode[] {
    init();
    const queryLower = query.toLowerCase();
    const scored = experiences.map((e) => {
      let score = 0;
      const keywords = queryLower.split(/\s+/);
      for (const kw of keywords) {
        if (e.incident_type.toLowerCase().includes(kw)) score += 3;
        if (e.root_cause.toLowerCase().includes(kw)) score += 2;
        if (e.symptoms.some((s) => s.toLowerCase().includes(kw))) score += 1;
        if (e.fix_applied.toLowerCase().includes(kw)) score += 1;
      }
      return { exp: e, score };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.exp);
  },

  findSuccessfulFixes(incidentType: string): ExperienceNode[] {
    init();
    return experiences.filter(
      (e) => e.incident_type.toLowerCase().includes(incidentType.toLowerCase()) && e.fix_effective
    );
  },

  findRecurringFaults(): ExperienceNode[] {
    init();
    return experiences.filter((e) => e.recurring);
  },

  getEarlyWarnings(): EarlyWarning[] {
    init();
    return [...earlyWarnings].sort((a, b) => b.confidence - a.confidence);
  },

  getBottlenecks(): PlantBottleneck[] {
    init();
    return [...bottlenecks].sort((a, b) => b.estimated_cost_usd - a.estimated_cost_usd);
  },

  getSpareShortages(): SpareShortage[] {
    init();
    return [...spareShortages].sort((a, b) => {
      const order = { p1_critical: 0, p2_high: 1, p3_medium: 2, p4_low: 3 };
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
    });
  },

  getRiskEscalations() {
    init();
    return generateRiskEscalations(assets);
  },

  getBacklogRanking() {
    init();
    return generateBacklogRanking(assets);
  },

  getPlantHealthRanking() {
    init();
    return generatePlantHealthRanking(assets);
  },

  getIntelligence() {
    init();
    return {
      earlyWarnings: this.getEarlyWarnings(),
      bottlenecks: this.getBottlenecks(),
      spareShortages: this.getSpareShortages(),
      riskEscalations: this.getRiskEscalations(),
      backlogRanking: this.getBacklogRanking(),
      plantHealthRanking: this.getPlantHealthRanking(),
    };
  },

  getAssetCount(): number {
    init();
    return assets.length;
  },
};
