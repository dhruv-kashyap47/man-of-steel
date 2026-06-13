import { StateGraph, END, START } from "@langchain/langgraph";
import { dataStore } from "@/lib/data/store";
import { semanticSearch, keywordSearch } from "@/lib/rag/search";
import { predictFromLatestSensors } from "@/lib/ml/predict";
import { invokeLLM } from "./llm";
import { searchWeb, formatWebResults } from "./web-search";
import { AgentState, type AgentStateType, type ChatMessage } from "./state";
import type { RiskLevel, PriorityLevel } from "@/types/database";

const CHAT_KEYWORDS = ["hello", "hi ", "hey", "how are you", "what's up", "good morning", "good evening", "thanks", "thank", "who are you", "what can you do", "help me"];
const WEB_SEARCH_KEYWORDS = ["search", "look up", "find online", "what is", "who is", "latest", "news", "google", "browse", "internet", "web"];

async function plannerNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const query = state.query.toLowerCase().trim();
  const workflow: string[] = ["planner"];

  let intent: "chat" | "diagnosis" | "prediction" | "procedure" | "whatif" | "general" = "general";

  if (CHAT_KEYWORDS.some(k => query.startsWith(k) || query === k || query.endsWith(k))) {
    intent = "chat";
    workflow.push("decision");
  } else if (query.includes("what if") || query.includes("what-if") || query.includes("simulate")) {
    intent = "whatif";
    workflow.push("predictor", "decision");
  } else if (query.includes("predict") || query.includes("rul") || query.includes("failure")) {
    intent = "prediction";
    workflow.push("predictor", "knowledge", "experience", "decision");
  } else if (query.includes("manual") || query.includes("sop") || query.includes("procedure") || query.includes("how to")) {
    intent = "procedure";
    workflow.push("knowledge", "decision");
  } else if (query.includes("priority") || query.includes("critical") || query.includes("urgent")) {
    intent = "diagnosis";
    workflow.push("predictor", "knowledge", "experience", "decision");
  } else if (query.includes("vibration") || query.includes("temperature") || query.includes("pressure") || query.includes("diagnos") || query.includes("root cause") || query.includes("why is")) {
    intent = "diagnosis";
    workflow.push("predictor", "knowledge", "experience", "decision");
  } else {
    intent = "general";
    workflow.push("knowledge", "predictor", "experience", "decision");
  }

  const needsWebSearch = WEB_SEARCH_KEYWORDS.some(k => query.includes(k))
    || (intent === "general" && query.length > 10)
    || query.includes("solution") || query.includes("alternative") || query.includes("best practice");

  if (needsWebSearch) {
    workflow.splice(workflow.indexOf("decision"), 0, "webSearch");
  }

  return { workflow, agentsInvoked: ["planner"], intent };
}

async function knowledgeNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (state.intent === "chat") {
    return { agentsInvoked: [...(state.agentsInvoked ?? []), "knowledge"] };
  }

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
  if (state.intent === "chat" || !state.assetId) {
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

  const priority = dataStore.getPriority(asset.id);
  const priorityData = priority ? {
    assetId: priority.asset_id,
    assetName: asset.name,
    machineType: asset.machine_type,
    priorityScore: priority.priority_score,
    priorityLevel: priority.priority_level,
    failureRisk: priority.failure_risk,
    remainingUsefulLifeHours: priority.remaining_useful_life_hours,
    processCriticality: priority.process_criticality,
    productionImpact: priority.production_impact,
    spareAvailability: priority.spare_availability,
    procurementLeadTimeDays: priority.procurement_lead_time_days,
    maintenanceWindow: priority.maintenance_window,
    procurementRecommendation: priority.procurement_recommendation,
    businessImpactSummary: priority.business_impact_summary,
    healthScore: asset.health_score,
    riskLevel: asset.risk_level,
  } : null;

  return {
    prediction,
    priority: priorityData,
    agentsInvoked: [...(state.agentsInvoked ?? []), "prediction"],
  };
}

async function experienceNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (state.intent === "chat") {
    return { agentsInvoked: [...(state.agentsInvoked ?? []), "experience"] };
  }

  const experiences = dataStore.findSimilarExperiences(state.query);
  const successfulFixes: typeof experiences = [];
  const failedFixes: typeof experiences = [];

  for (const exp of experiences) {
    if (exp.fix_effective) {
      successfulFixes.push(exp);
    } else {
      failedFixes.push(exp);
    }
  }

  const experienceSummaries = experiences.map((e) => ({
    incidentType: e.incident_type,
    rootCause: e.root_cause,
    fixApplied: e.fix_applied,
    fixEffective: e.fix_effective,
    confidence: e.confidence_adjustment,
  }));

  const historicalCases = [
    ...successfulFixes.map((e) => `${e.incident_type}: ${e.fix_applied} (effective, confidence +${e.confidence_adjustment})`),
    ...failedFixes.map((e) => `${e.incident_type}: ${e.fix_applied} (ineffective, confidence ${e.confidence_adjustment})`),
  ];

  const confidenceAdjustment = experiences.reduce((sum, e) => {
    return e.fix_effective ? sum + e.confidence_adjustment : sum - e.confidence_adjustment;
  }, 0);

  const baseConfidence = state.prediction?.confidence ?? 0.7;
  const adjustedConfidence = Math.max(0.1, Math.min(0.99, baseConfidence + confidenceAdjustment));

  return {
    experiences: experienceSummaries,
    confidence: Math.round(adjustedConfidence * 10000) / 10000,
    historicalCases: historicalCases.slice(0, 5),
    agentsInvoked: [...(state.agentsInvoked ?? []), "experience"],
  };
}

async function webSearchNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const results = await searchWeb(state.query);
  return {
    webSearchResults: results,
    agentsInvoked: [...(state.agentsInvoked ?? []), "webSearch"],
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

  const priorityText = state.priority
    ? `Priority Score: ${state.priority.priorityScore}/100, Level: ${state.priority.priorityLevel}, Window: ${state.priority.maintenanceWindow}, Procurement: ${state.priority.procurementRecommendation}`
    : "No priority data available";

  const experienceText = (state.experiences ?? [])
    .map((e) => `- ${e.incidentType}: Root cause: ${e.rootCause}. Fix: ${e.fixApplied}. ${e.fixEffective ? "Effective" : "Ineffective"} (confidence adj: ${e.confidence > 0 ? "+" : ""}${(e.confidence * 100).toFixed(0)}%)`)
    .join("\n");

  const isChattyIntent = state.intent === "chat" || state.intent === "general";
  const hasWebResults = state.webSearchResults && state.webSearchResults.length > 0;
  const hasCitations = state.citations && state.citations.length > 0;

  const systemPrompt = `You are the AI Copilot for MAN OF STEEL — the industrial maintenance intelligence platform for Tata Steel Integrated Plant.

YOUR PERSONALITY:
- You're a knowledgeable, friendly senior maintenance engineer and technician rolled into one
- You speak naturally and conversationally, like a skilled engineer talking to a colleague
- You're passionate about industrial machinery, steel manufacturing, and keeping things running smoothly
- You use plain language first, technical depth when needed
- You can be casual ("Hey! How can I help you today?") or technical ("Based on the vibration analysis...") depending on the situation
- You're helpful, practical, and solutions-oriented

HOW YOU RESPOND:
- ADAPT your response style to the user's query. If they say "hi", greet them back casually. If they ask a technical question, dive into the details.
- For casual conversation, general questions, or web searches: respond naturally without any forced structure
- For maintenance/diagnostic queries: provide a clear, structured technical response but keep it conversational
- When technical data (predictions, citations, sensor readings) is available, weave it naturally into your response rather than dumping every section
- NEVER force a 15-section report unless the user specifically asks for a "full report" or "detailed investigation"
- If web search results are available, reference them naturally to provide up-to-date information
- If no technical data is available for casual queries, just have a normal conversation

YOUR RESPONSE FORMAT:
Respond in JSON with these keys:
- "response": your main response text (markdown, any style that fits the context)
- "rootCause": set only for technical queries, otherwise empty string
- "riskLevel": "low" | "medium" | "high" | "critical" (set only for technical queries, otherwise "low")
- "recommendedActions": array of strings (set only for technical queries, otherwise empty array)
- "businessImpact": set only for technical queries, otherwise empty string
- "executiveSummary": brief summary of your response`;

  let webSearchText = "";
  if (hasWebResults) {
    webSearchText = `\n\n## Web Search Results (for additional context)\n${formatWebResults(state.webSearchResults!)}`;
  }

  const historyContext = state.conversationHistory && state.conversationHistory.length > 0
    ? `\n\n## Recent Conversation History\nThe user has been discussing:\n${state.conversationHistory.slice(-4).map((m: ChatMessage) => `[${m.role}]: ${m.content.slice(0, 300)}`).join("\n")}`
    : "";

  const conversationGuidance = isChattyIntent
    ? `\n\nThis seems like a casual or general query. Respond naturally and conversationally. No structured report needed.`
    : `\n\nThis is a technical maintenance query. Provide a clear technical response using the data available.`;

  const userPrompt = `## Query
${state.query}
${conversationGuidance}

## Asset Information${isChattyIntent ? " (if relevant)" : ""}
- Asset: ${asset?.name ?? "Plant-wide"} (${asset?.serial_number ?? "N/A"})
- Machine Type: ${state.machineType ?? "N/A"}
- Health Score: ${asset?.health_score ?? "N/A"}
- Status: ${asset?.status ?? "N/A"}${historyContext}

## System Data${isChattyIntent ? " (optional — use if helpful)" : ""}
### Prediction
${predictionText}

### Priority Data
${priorityText}

### Knowledge Base${hasCitations ? "" : " (no specific documents found for this query)"}
${citationText || "No direct citations from knowledge vault."}

### Historical Cases
${experienceText || "No similar historical cases found."}

### Recent Maintenance History
${maintenance.map((m) => `- ${m.title} (${m.maintenance_type}) on ${m.performed_at.split("T")[0]}`).join("\n") || "None"}${webSearchText}

## Confidence Score
Base confidence: ${state.confidence ?? state.prediction?.confidence ?? 0.7}

Respond naturally and helpfully. Be the best engineer-technician hybrid the user could ask for.`;

  const llmResponse = await invokeLLM(systemPrompt, userPrompt);

  if (llmResponse) {
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          rootCause: parsed.rootCause ?? "",
          riskLevel: (parsed.riskLevel ?? state.prediction?.riskLevel ?? (isChattyIntent ? "low" : "medium")) as RiskLevel,
          recommendedActions: parsed.recommendedActions ?? [],
          businessImpact: parsed.businessImpact ?? "",
          executiveSummary: parsed.executiveSummary ?? "",
          response: parsed.response ?? llmResponse,
          agentsInvoked: [...(state.agentsInvoked ?? []), "decision"],
          confidence: parsed.confidence ?? state.confidence ?? state.prediction?.confidence ?? 0.7,
          sourceCitations: parsed.sourceCitations ?? [],
        };
      }
    } catch {
      // fall through to raw response
    }
    return {
      rootCause: isChattyIntent ? "" : "AI analysis complete — see response",
      riskLevel: isChattyIntent ? "low" : (state.prediction?.riskLevel ?? "medium") as RiskLevel,
      recommendedActions: isChattyIntent ? [] : [],
      businessImpact: isChattyIntent ? "" : "See detailed response",
      executiveSummary: llmResponse.slice(0, 200),
      response: llmResponse,
      agentsInvoked: [...(state.agentsInvoked ?? []), "decision"],
      confidence: state.confidence ?? state.prediction?.confidence ?? 0.7,
    };
  }

  if (isChattyIntent) {
    return {
      rootCause: "",
      riskLevel: "low" as RiskLevel,
      recommendedActions: [],
      businessImpact: "",
      executiveSummary: "Conversational response",
      response: "Hey there! I'm the MAN OF STEEL AI Copilot. I can help you with maintenance diagnostics, failure predictions, root cause analysis, and technical guidance. What can I help you with?",
      agentsInvoked: [...(state.agentsInvoked ?? []), "decision"],
      confidence: 0.9,
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
  const experiences = state.experiences ?? [];
  const priority = state.priority;
  const riskLevel = (pred?.riskLevel ?? asset?.risk_level ?? "medium") as RiskLevel;

  let rootCause = "Insufficient sensor anomaly correlation for definitive root cause.";
  const immediateActions: string[] = [];
  const longTermActions: string[] = [];

  if (pred && pred.failureProbability > 0.5) {
    rootCause = `${pred.predictedFailureMode} indicated by elevated sensor readings. Vibration and thermal signatures correlate with historical failure patterns.`;
    immediateActions.push(`Schedule inspection within ${pred.failureProbability > 0.75 ? "24" : "72"} hours`);
    immediateActions.push(`Order replacement parts for ${pred.predictedFailureMode}`);
    immediateActions.push("Increase monitoring frequency to hourly snapshots");
    longTermActions.push("Implement condition-based maintenance schedule");
    longTermActions.push("Review spare parts inventory for critical components");
  }

  if (priority) {
    immediateActions.push(`Maintenance Window: ${priority.maintenanceWindow}`);
    immediateActions.push(`Procurement Action: ${priority.procurementRecommendation}`);
    longTermActions.push(`Review ${asset?.name ?? "asset"} for process criticality reassessment`);
  }

  if (citations.length > 0) {
    immediateActions.push(`Review ${citations[0].document_title} for standard remediation procedure`);
  }

  if (experiences.length > 0) {
    const bestMatch = experiences[0];
    immediateActions.push(`Apply known fix from similar case: ${bestMatch.fixApplied}`);
    if (bestMatch.fixEffective) {
      immediateActions.push(`Historical success rate: high (confidence +${(bestMatch.confidence * 100).toFixed(0)}%)`);
    }
  }

  if (immediateActions.length === 0) {
    immediateActions.push("Continue routine monitoring");
    immediateActions.push("Review sensor baselines during next shift handover");
  }

  const confidenceScore = state.confidence ?? pred?.confidence ?? 0.7;

  const response = `## 1. EXECUTIVE SUMMARY

**Asset:** ${asset?.name ?? "Plant-wide"} ${asset ? `(${asset.serial_number})` : ""}

${pred && pred.failureProbability > 0.75
  ? `Critical condition requiring immediate executive attention. Failure probability ${(pred.failureProbability * 100).toFixed(0)}% with estimated RUL of ${pred.remainingUsefulLifeHours.toLocaleString()} hours. Estimated production impact: $1.5M–$2.4M per 48-hour outage.`
  : pred && pred.failureProbability > 0.5
    ? `High-risk condition detected. Failure probability ${(pred.failureProbability * 100).toFixed(0)}%. Proactive maintenance recommended within 7 days.`
    : `Asset operating within acceptable parameters. Routine monitoring sufficient.`}

## 2. FAULT DIAGNOSIS

${rootCause}

## 3. ROOT CAUSE ANALYSIS

${pred ? `Primary failure mode: ${pred.predictedFailureMode}. Confidence: ${(confidenceScore * 100).toFixed(0)}%.` : "Root cause analysis requires additional sensor data and inspection."}

${experiences.length > 0 ? `Based on ${experiences.length} similar historical case(s), the most likely root cause pattern is: ${experiences[0].rootCause}` : ""}

## 4. SUPPORTING EVIDENCE

${pred ? `- Failure Probability: **${(pred.failureProbability * 100).toFixed(1)}%**
- Remaining Useful Life: **${pred.remainingUsefulLifeHours.toLocaleString()} hours**
- Predicted Mode: ${pred.predictedFailureMode}
- Confidence: ${(confidenceScore * 100).toFixed(0)}%` : "No asset-specific prediction available."}

## 5. SENSOR INTERPRETATION

${pred
  ? `- Temperature: ${pred.features.temperature_c.toFixed(1)}°C ${pred.features.temperature_c > 75 ? "(WARNING — above threshold)" : "(within normal range)"}
- Pressure: ${pred.features.pressure_bar.toFixed(1)} bar ${pred.features.pressure_bar > 8.5 ? "(WARNING)" : "(normal)"}
- RPM: ${pred.features.rpm.toFixed(0)} ${pred.features.rpm > 3200 ? "(HIGH — monitoring recommended)" : "(normal)"}
- Vibration: ${pred.features.vibration_mm_s.toFixed(2)} mm/s ${pred.features.vibration_mm_s > 4.5 ? "(WARNING — above threshold)" : "(within limits)"}`
  : "Sensor data not available for interpretation."}

## 6. SIMILAR HISTORICAL CASES

${state.historicalCases && state.historicalCases.length > 0
  ? state.historicalCases.map((c, i) => `${i + 1}. ${c}`).join("\n")
  : experiences.length > 0
    ? experiences.slice(0, 3).map((e, i) => `${i + 1}. ${e.incidentType}: ${e.rootCause} → ${e.fixApplied}`).join("\n")
    : "No similar historical cases found in the experience database."}

## 7. RISK ASSESSMENT

**Current Risk Level:** ${riskLevel.toUpperCase()}

${pred && pred.failureProbability > 0.75
  ? "CRITICAL: Immediate action required. Risk of catastrophic failure with plant-wide production impact."
  : pred && pred.failureProbability > 0.5
    ? "HIGH: Elevated risk requiring scheduled intervention within 7 days."
    : "MODERATE: Manageable risk with routine monitoring and preventive maintenance."}

## 8. REMAINING USEFUL LIFE

${pred
  ? `Estimated ${pred.remainingUsefulLifeHours.toLocaleString()} hours (${Math.round(pred.remainingUsefulLifeHours / 24)} days) remaining before critical failure.`
  : "RUL estimation requires asset-specific prediction data."}

## 9. MAINTENANCE PRIORITY

${priority
  ? `**Priority Level:** ${priority.priorityLevel}
**Score:** ${priority.priorityScore}/100
**Maintenance Window:** ${priority.maintenanceWindow}
**Spare Availability:** ${(priority.spareAvailability * 100).toFixed(0)}%
**Procurement Lead Time:** ${priority.procurementLeadTimeDays} days
**Business Impact:** ${priority.businessImpactSummary}`
  : "Maintenance priority assessment not available for this scope."}

## 10. IMMEDIATE ACTIONS

${immediateActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## 11. LONG-TERM ACTIONS

${longTermActions.length > 0
  ? longTermActions.map((a, i) => `${i + 1}. ${a}`).join("\n")
  : "1. Implement condition-based maintenance program\n2. Review asset criticality classification\n3. Update spare parts inventory strategy"}

## 12. SPARE PARTS STRATEGY

${priority
  ? `${priority.procurementRecommendation}\n\nCurrent spare availability: ${(priority.spareAvailability * 100).toFixed(0)}%. Procurement lead time: ${priority.procurementLeadTimeDays} days.`
  : "Review spare parts inventory for critical components. Ensure critical spares are available within lead times."}

## 13. PROCUREMENT RISKS

${priority && priority.procurementLeadTimeDays > 60
  ? `HIGH RISK: Procurement lead time of ${priority.procurementLeadTimeDays} days exceeds acceptable threshold. Consider expedited ordering or alternative suppliers.`
  : priority && priority.procurementLeadTimeDays > 30
    ? `MODERATE RISK: Lead time of ${priority.procurementLeadTimeDays} days requires advance planning. Monitor inventory levels.`
    : "Low procurement risk. Standard lead times apply."}

## 14. CONFIDENCE SCORE

**${(confidenceScore * 100).toFixed(0)}%** confidence in this assessment.

${confidenceScore > 0.8
  ? "High confidence — strong correlation between sensor data, historical patterns, and prediction model."
  : confidenceScore > 0.6
    ? "Moderate confidence — recommend additional data collection to improve accuracy."
    : "Low confidence — manual inspection recommended to validate findings."}

## 15. SOURCE CITATIONS

${citations.length > 0
  ? citations.map((c, i) => `[${i + 1}] **${c.document_title}** (${(c.similarity * 100).toFixed(0)}% relevance)\n    ${c.content_snippet.slice(0, 120)}...`)
    .join("\n\n")
  : "No direct document citations. Assessment based on sensor data analysis and engineering models."}`;

  return {
    rootCause,
    riskLevel,
    recommendedActions: [...immediateActions, ...longTermActions],
    businessImpact:
      pred && pred.failureProbability > 0.75
        ? "$1.5M–$2.4M production risk per 48hr outage"
        : "Low immediate financial exposure",
    executiveSummary: `${asset?.name ?? "Plant"}: ${rootCause.slice(0, 120)}...`,
    response,
    agentsInvoked: [...(state.agentsInvoked ?? []), "decision"],
    confidence: confidenceScore,
    immediateActions,
    longTermActions,
    sparePartsStrategy: priority?.procurementRecommendation ?? "Standard replenishment",
    procurementRisks: priority && priority.procurementLeadTimeDays > 60
      ? [`${priority.procurementLeadTimeDays}-day lead time exceeds acceptable threshold`]
      : [],
    sourceCitations: citations.map((c) => `${c.document_title} (${(c.similarity * 100).toFixed(0)}%)`),
    historicalCases: state.historicalCases ?? experiences.map((e) => `${e.incidentType}: ${e.fixApplied}`),
  };
}

function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("planner", plannerNode)
    .addNode("knowledge", knowledgeNode)
    .addNode("predictor", predictionNode)
    .addNode("experience", experienceNode)
    .addNode("webSearch", webSearchNode)
    .addNode("decision", decisionNode)
    .addEdge(START, "planner")
    .addConditionalEdges("planner", (state: AgentStateType) => {
      if (state.intent === "chat") return "decision";
      return "knowledge";
    })
    .addConditionalEdges("knowledge", (state: AgentStateType) => {
      if (state.intent === "chat") return "decision";
      if (state.intent === "procedure") return "decision";
      return "predictor";
    })
    .addConditionalEdges("predictor", (state: AgentStateType) => {
      if (state.intent === "prediction" || state.intent === "whatif" || state.intent === "diagnosis") return "experience";
      return "webSearch";
    })
    .addConditionalEdges("experience", (state: AgentStateType) => {
      return "webSearch";
    })
    .addConditionalEdges("webSearch", (state: AgentStateType) => {
      return "decision";
    })
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
  assetId?: string | null,
  conversationHistory?: ChatMessage[]
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
    priority: null,
    experiences: [],
    confidence: 0.7,
    rootCause: "",
    riskLevel: "medium" as RiskLevel,
    recommendedActions: [],
    businessImpact: "",
    executiveSummary: "",
    response: "",
    agentsInvoked: [],
    sensorInterpretation: "",
    historicalCases: [],
    sparePartsStrategy: "",
    procurementRisks: [],
    sourceCitations: [],
    immediateActions: [],
    longTermActions: [],
    consequencesOfInaction: "",
    conversationHistory: conversationHistory ?? [],
    webSearchResults: [],
    intent: "general",
  });

  return result;
}
