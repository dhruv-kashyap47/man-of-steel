import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";
import { runAgentWorkflow } from "@/lib/agents/graph";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET() {
  return NextResponse.json({ conversations: dataStore.getConversations() });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = checkRateLimit(`copilot:${ip}`, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { query, assetId, conversationId } = body as {
      query: string;
      assetId?: string;
      conversationId?: string;
    };

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    let conversation = conversationId
      ? dataStore.getConversation(conversationId)
      : null;

    if (!conversation) {
      const asset = assetId ? dataStore.getAsset(assetId) : null;
      conversation = dataStore.createConversation(
        assetId,
        asset ? `Investigation: ${asset.name}` : "New Investigation"
      );
    }

    dataStore.addMessage({
      conversation_id: conversation.id,
      role: "user",
      content: query,
      agent_name: null,
      citations: [],
      metadata: {},
    });

    const start = Date.now();
    const result = await runAgentWorkflow(query, assetId ?? conversation.asset_id);
    const duration = Date.now() - start;

    const assistantMsg = dataStore.addMessage({
      conversation_id: conversation.id,
      role: "assistant",
      content: result.response,
      agent_name: "decision",
      citations: result.citations ?? [],
      metadata: {
        rootCause: result.rootCause,
        riskLevel: result.riskLevel,
        recommendedActions: result.recommendedActions,
        businessImpact: result.businessImpact,
        executiveSummary: result.executiveSummary,
        prediction: result.prediction,
        agentsInvoked: result.agentsInvoked,
        durationMs: duration,
        confidence: result.confidence,
        priority: result.priority,
        experiences: result.experiences,
        immediateActions: result.immediateActions,
        longTermActions: result.longTermActions,
        sparePartsStrategy: result.sparePartsStrategy,
        procurementRisks: result.procurementRisks,
        sourceCitations: result.sourceCitations,
        historicalCases: result.historicalCases,
      },
    });

    return NextResponse.json({
      conversation,
      message: assistantMsg,
      decision: {
        rootCause: result.rootCause,
        riskLevel: result.riskLevel,
        recommendedActions: result.recommendedActions,
        businessImpact: result.businessImpact,
        executiveSummary: result.executiveSummary,
        prediction: result.prediction,
        citations: result.citations,
        agentsInvoked: result.agentsInvoked,
        durationMs: duration,
        confidence: result.confidence,
        priority: result.priority,
        experiences: result.experiences,
        immediateActions: result.immediateActions,
        longTermActions: result.longTermActions,
        sparePartsStrategy: result.sparePartsStrategy,
        procurementRisks: result.procurementRisks,
        sourceCitations: result.sourceCitations,
        historicalCases: result.historicalCases,
      },
    });
  } catch (err) {
    console.error("Copilot error:", err);
    return NextResponse.json(
      { error: "Agent workflow failed" },
      { status: 500 }
    );
  }
}
