import { Annotation } from "@langchain/langgraph";
import type { Citation, RiskLevel } from "@/types/database";
import type { PredictionResult } from "@/types";

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
});

export type AgentStateType = typeof AgentState.State;
