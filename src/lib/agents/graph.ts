import { StateGraph, END, START } from "@langchain/langgraph";
import { dataStore } from "@/lib/data/store";
import { semanticSearch, keywordSearch } from "@/lib/rag/search";
import { predictFromLatestSensors } from "@/lib/ml/predict";
import { invokeLLM } from "./llm";
import { AgentState, type AgentStateType } from "./state";
import type { RiskLevel } from "@/types/database";

async function plannerNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const query = state.query.toLowerCase();
  const workflow: string[] = ["planner"];

  if (query.includes("what if") || query.includes("what-if") || query.includes("simulate")) {
    workflow.push("predictor", "decision");
  } else if (query.includes("predict") || query.includes("rul") || query.includes("failure")) {
    workflow.push("predictor", "knowledge", "decision");
  } else if (query.includes("manual") || query.includes("sop") || query.includes("procedure")) {
    workflow.push("knowledge", "decision");
  } else {
    workflow.push("knowledge", "predictor", "decision");
  }

  return { workflow, agentsInvoked: ["planner"] };
}

async function knowledgeNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  let citations = await semanticSearch({
    query: state.query,
    machineType: state.machineType as Parameters<typeof semanticSearch>[0]["machineType"],
    limit: 6,
  });

  if (citations.length === 0) {
    citations = keywordSearch(state.query, 5);
  }

  return {
    citations,
    agentsInvoked: [...(state.agentsInvoked ?? []), "knowledge"],
  };
}

async function predictionNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (!state.assetId) {
    return { agentsInvoked: [...(state.agentsInvoked ?? []), "prediction"] };
  }

  const asset = dataStore.getAsset(state.assetId);
  if (!asset) {
    return { agentsInvoked: [...(state.agentsInvoked ?? []), "prediction"] };
  }

  const readings = dataStore.getSensorReadings(asset.id);
  const latest = readings[readings.length - 1];
  if (!latest) {
    return { agentsInvoked: [...(state.agentsInvoked ?? []), "prediction"] };
  }

  const prediction = predictFromLatestSensors(
    {
      temperature_c: latest.temperature_c,
      pressure_bar: latest.pressure_bar,
      rpm: latest.rpm,
      vibration_mm_s: latest.vibration_mm_s,
      operating_hours: latest.operating_hours,
    },
    asset.machine_type,
    asset.operating_hours
  );

  return {
    prediction,
    agentsInvoked: [...(state.agentsInvoked ?? []), "prediction"],
  };
}

async function decisionNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const asset = state.assetId ? dataStore.getAsset(state.assetId) : null;
  const maintenance = state.assetId
    ? dataStore.getMaintenanceRecords(state.assetId).slice(0, 3)
    : [];

  const citationText = (state.citations ?? [])
    .map((c) => `[${c.document_title}]: ${c.content_snippet}`)
    .join("\n");

  const predictionText = state.prediction
    ? `Failure Probability: ${(state.prediction.failureProbability * 100).toFixed(1)}%, RUL: ${state.prediction.remainingUsefulLifeHours}h, Mode: ${state.prediction.predictedFailureMode}`
    : "No prediction available";

  const systemPrompt = `You are the Decision Agent for MAN OF STEEL industrial maintenance platform.
Analyze evidence and produce a structured maintenance intelligence response.
Respond in JSON with keys: rootCause, riskLevel (low|medium|high|critical), recommendedActions (array), businessImpact, executiveSummary, response (detailed markdown response).`;

  const userPrompt = `Query: ${state.query}
Asset: ${asset?.name ?? "Plant-wide"} (${asset?.serial_number ?? "N/A"})
Machine Type: ${state.machineType ?? "N/A"}
Health Score: ${asset?.health_score ?? "N/A"}

Prediction: ${predictionText}

Knowledge Base Evidence:
${citationText || "No direct citations found."}

Recent Maintenance:
${maintenance.map((m) => `- ${m.title} (${m.maintenance_type})`).join("\n") || "None"}`;

  const llmResponse = await invokeLLM(systemPrompt, userPrompt);

  if (llmResponse) {
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          rootCause: parsed.rootCause ?? "Analysis pending further investigation",
          riskLevel: (parsed.riskLevel ?? state.prediction?.riskLevel ?? "medium") as RiskLevel,
          recommendedActions: parsed.recommendedActions ?? [],
          businessImpact: parsed.businessImpact ?? "Impact assessment in progress",
          executiveSummary: parsed.executiveSummary ?? "",
          response: parsed.response ?? llmResponse,
          agentsInvoked: [...(state.agentsInvoked ?? []), "decision"],
        };
      }
    } catch {
      // fall through to rule-based
    }
    return {
      rootCause: "AI analysis complete — see response",
      riskLevel: (state.prediction?.riskLevel ?? "medium") as RiskLevel,
      recommendedActions: [],
      businessImpact: "See detailed response",
      executiveSummary: llmResponse.slice(0, 200),
      response: llmResponse,
      agentsInvoked: [...(state.agentsInvoked ?? []), "decision"],
    };
  }

  return ruleBasedDecision(state, asset ?? undefined);
}

function ruleBasedDecision(
  state: AgentStateType,
  asset: ReturnType<typeof dataStore.getAsset>
): Partial<AgentStateType> {
  const pred = state.prediction;
  const citations = state.citations ?? [];
  const riskLevel = (pred?.riskLevel ?? asset?.risk_level ?? "medium") as RiskLevel;

  let rootCause = "Insufficient sensor anomaly correlation for definitive root cause.";
  const actions: string[] = [];

  if (pred && pred.failureProbability > 0.5) {
    rootCause = `${pred.predictedFailureMode} indicated by elevated sensor readings. Vibration and thermal signatures correlate with historical failure patterns.`;
    actions.push(`Schedule inspection within ${pred.failureProbability > 0.75 ? "24" : "72"} hours`);
    actions.push(`Order replacement parts for ${pred.predictedFailureMode}`);
    actions.push("Increase monitoring frequency to hourly snapshots");
  }

  if (citations.length > 0) {
    actions.push(`Review ${citations[0].document_title} for standard remediation procedure`);
  }

  if (actions.length === 0) {
    actions.push("Continue routine monitoring");
    actions.push("Review sensor baselines during next shift handover");
  }

  const response = `## Diagnostic Analysis

**Asset:** ${asset?.name ?? "Plant-wide"} ${asset ? `(${asset.serial_number})` : ""}

### Root Cause Assessment
${rootCause}

### Prediction Summary
${pred ? `- Failure Probability: **${(pred.failureProbability * 100).toFixed(1)}%**\n- Remaining Useful Life: **${pred.remainingUsefulLifeHours.toLocaleString()} hours**\n- Predicted Mode: ${pred.predictedFailureMode}\n- Confidence: ${(pred.confidence * 100).toFixed(0)}%` : "No asset-specific prediction available."}

### Recommended Actions
${actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

${citations.length > 0 ? `### Knowledge Base References\n${citations.map((c) => `- **${c.document_title}** (relevance: ${(c.similarity * 100).toFixed(0)}%)`).join("\n")}` : ""}

### Business Impact
${pred && pred.failureProbability > 0.75 ? "Critical risk of unplanned downtime. Estimated production impact: $1.5M–$2.4M per 48-hour outage." : "Manageable risk with proactive maintenance scheduling."}`;

  return {
    rootCause,
    riskLevel,
    recommendedActions: actions,
    businessImpact:
      pred && pred.failureProbability > 0.75
        ? "$1.5M–$2.4M production risk per 48hr outage"
        : "Low immediate financial exposure",
    executiveSummary: `${asset?.name ?? "Plant"}: ${rootCause.slice(0, 120)}...`,
    response,
    agentsInvoked: [...(state.agentsInvoked ?? []), "decision"],
  };
}

function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("planner", plannerNode)
    .addNode("knowledge", knowledgeNode)
    .addNode("predictor", predictionNode)
    .addNode("decision", decisionNode)
    .addEdge(START, "planner")
    .addEdge("planner", "knowledge")
    .addEdge("knowledge", "predictor")
    .addEdge("predictor", "decision")
    .addEdge("decision", END);

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildGraph> | null = null;

export function getAgentGraph() {
  if (!compiledGraph) compiledGraph = buildGraph();
  return compiledGraph;
}

export async function runAgentWorkflow(
  query: string,
  assetId?: string | null
): Promise<AgentStateType> {
  const asset = assetId ? dataStore.getAsset(assetId) : null;
  const graph = getAgentGraph();

  const result = await graph.invoke({
    query,
    assetId: assetId ?? null,
    assetName: asset?.name ?? null,
    machineType: asset?.machine_type ?? null,
    workflow: [],
    citations: [],
    prediction: null,
    rootCause: "",
    riskLevel: "medium" as RiskLevel,
    recommendedActions: [],
    businessImpact: "",
    executiveSummary: "",
    response: "",
    agentsInvoked: [],
  });

  return result;
}
