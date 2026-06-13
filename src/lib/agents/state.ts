import { Annotation } from "@langchain/langgraph";
import type { Citation, RiskLevel, PriorityLevel } from "@/types/database";
import type { PredictionResult, PriorityData } from "@/types";

export const AgentState = Annotation.Root({
  query: Annotation<string>,
  assetId: Annotation<string | null>,
  assetName: Annotation<string | null>,
  machineType: Annotation<string | null>,
  workflow: Annotation<string[]>,
  citations: Annotation<Citation[]>,
  prediction: Annotation<PredictionResult | null>,
  rootCause: Annotation<string>,
  riskLevel: Annotation<RiskLevel>,
  recommendedActions: Annotation<string[]>,
  businessImpact: Annotation<string>,
  executiveSummary: Annotation<string>,
  response: Annotation<string>,
  agentsInvoked: Annotation<string[]>,
  priority: Annotation<PriorityData | null>,
  experiences: Annotation<Array<{
    incidentType: string;
    rootCause: string;
    fixApplied: string;
    fixEffective: boolean;
    confidence: number;
  }>>,
  confidence: Annotation<number>,
  sensorInterpretation: Annotation<string>,
  historicalCases: Annotation<string[]>,
  sparePartsStrategy: Annotation<string>,
  procurementRisks: Annotation<string[]>,
  sourceCitations: Annotation<string[]>,
  immediateActions: Annotation<string[]>,
  longTermActions: Annotation<string[]>,
  consequencesOfInaction: Annotation<string>,
});

export type AgentStateType = typeof AgentState.State;
