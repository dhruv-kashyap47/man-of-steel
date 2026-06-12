"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  BookOpen,
  Cpu,
  Brain,
  Target,
  Sparkles,
  Activity,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/status-badge";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import type { Asset, CopilotMessage } from "@/types/database";
import type { AgentDecision } from "@/types";

const SUGGESTED_QUERIES = [
  "What is causing the elevated vibration on Blast Furnace Fan A?",
  "Predict failure probability for the hydraulic pump",
  "What maintenance procedure should I follow for bearing replacement?",
  "What-if: vibration increases to 8 mm/s on the rolling mill",
  "Analyze root cause of pressure instability on HP-4421",
];

const AGENT_ICONS: Record<string, React.ElementType> = {
  planner: Target,
  knowledge: BookOpen,
  prediction: Cpu,
  decision: Brain,
};

export function ChatInterface() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastDecision, setLastDecision] = useState<AgentDecision | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/assets").then((r) => r.json()).then((d) => setAssets(d.assets));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const msgIdRef = useRef(0);
  async function sendMessage(query: string) {
    if (!query.trim() || loading) return;
    setInput("");
    setLoading(true);

    msgIdRef.current += 1;
    const userMsg: CopilotMessage = {
      id: `temp-${msgIdRef.current}`,
      conversation_id: conversationId ?? "",
      role: "user",
      content: query,
      agent_name: null,
      citations: [],
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          assetId: selectedAsset || undefined,
          conversationId,
        }),
      });
      const data = await res.json();
      setConversationId(data.conversation.id);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsg.id),
        { ...userMsg, conversation_id: data.conversation.id },
        data.message,
      ]);
      setLastDecision(data.decision);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversation_id: conversationId ?? "",
          role: "assistant",
          content: "Agent system encountered an error. Please try again.",
          agent_name: "system",
          citations: [],
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh)] flex-col">
      <PageHeader
        badge="Multi-Agent Intelligence"
        title="AI Copilot"
        subtitle="Diagnostics · Root Cause · Recommendations · What-If Analysis"
        actions={
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">All Assets (Plant-wide)</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.serial_number})
              </option>
            ))}
          </select>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="mb-4 h-10 w-10 text-accent" />
                <h3 className="text-lg font-semibold text-foreground">MAN OF STEEL Agent System</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Four specialized agents collaborate to diagnose issues, search knowledge bases,
                  predict failures, and recommend actions.
                </p>
                <div className="mt-6 grid max-w-2xl gap-2">
                  {SUGGESTED_QUERIES.map((q) => (
                    <motion.button
                      key={q}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendMessage(q)}
                      className="rounded-lg border border-border px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-foreground"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
                      <Bot className="h-4 w-4 text-accent" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                          msg.role === "user"
                        ? "bg-primary/20 border border-primary/20"
                        : "hud-panel"
                    }`}
                  >
                    {msg.agent_name && (
                      <Badge variant="cyan" className="mb-2 text-[10px]">
                        <Activity className="h-3 w-3 mr-1" />
                        {msg.agent_name} agent
                      </Badge>
                    )}
                    <div className="prose prose-invert prose-sm max-w-none text-sm whitespace-pre-wrap">
                      {msg.content.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) return <h3 key={i} className="mt-2 text-base font-semibold text-cyan-300">{line.slice(3)}</h3>;
                        if (line.startsWith("### ")) return <h4 key={i} className="mt-1 font-medium text-slate-200">{line.slice(4)}</h4>;
                        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
                        if (line.startsWith("- ")) return <p key={i} className="ml-2 text-muted-foreground">• {line.slice(2)}</p>;
                        if (/^\d+\./.test(line)) return <p key={i} className="ml-2">{line}</p>;
                        if (line.startsWith("Observation:")) return <p key={i} className="mt-1 text-sm"><span className="font-bold text-cyan-400">Observation:</span> <span className="text-foreground">{line.slice(12)}</span></p>;
                        if (line.startsWith("Evidence:")) return <p key={i} className="text-sm"><span className="font-bold text-blue-400">Evidence:</span> <span className="text-foreground">{line.slice(9)}</span></p>;
                        if (line.startsWith("Risk:")) return <p key={i} className="text-sm"><span className="font-bold text-amber-400">Risk:</span> <span className="text-foreground">{line.slice(5)}</span></p>;
                        if (line.startsWith("Action:")) return <p key={i} className="text-sm"><span className="font-bold text-emerald-400">Action:</span> <span className="text-foreground">{line.slice(7)}</span></p>;
                        return line ? <p key={i}>{line}</p> : <br key={i} />;
                      })}
                    </div>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 border-t border-border/30 pt-2">
                        <p className="text-[10px] uppercase text-muted-foreground">Citations</p>
                        {msg.citations.map((c, i) => (
                          <p key={i} className="text-xs text-cyan-400/70">
                            [{i + 1}] {c.document_title} ({(c.similarity * 100).toFixed(0)}%)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-cyan-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Agents investigating...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/60 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask about diagnostics, root cause, predictions, or what-if scenarios..."
                className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm focus:border-cyan-500/50 focus:outline-none"
                disabled={loading}
              />
              <Button
                variant="hud"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Agent panel */}
        <div className="w-80 shrink-0 border-l border-border p-4 space-y-4 overflow-y-auto">
          {/* Agent Pipeline Visualization */}
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Agent Pipeline
            </p>
            <div className="relative">
              {/* Pipeline flow line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
              {["planner", "knowledge", "prediction", "decision"].map((agent, idx) => {
                const Icon = AGENT_ICONS[agent];
                const invoked = lastDecision?.agentsInvoked?.includes(agent);
                return (
                  <motion.div
                    key={agent}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative mb-3 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      invoked
                        ? "border-accent/20 bg-accent/5"
                        : "border-border opacity-40"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      invoked ? "bg-accent/20" : "bg-secondary"
                    }`}>
                      <Icon className={`h-4 w-4 ${invoked ? "text-accent" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{agent}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {agent === "planner" && "Query decomposition"}
                        {agent === "knowledge" && "Document retrieval"}
                        {agent === "prediction" && "Failure analysis"}
                        {agent === "decision" && "Root cause synthesis"}
                      </p>
                    </div>
                    {invoked && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Agent Reasoning Panel */}
          {lastDecision && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Decision Summary
              </p>

              {/* Confidence bar */}
              {lastDecision.prediction && (
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-muted-foreground">Confidence Score</p>
                    <p className="text-xs font-bold text-accent">
                      {formatPercent(lastDecision.prediction.confidence)}
                    </p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${lastDecision.prediction.confidence * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-accent"
                    />
                  </div>
                </div>
              )}

              {/* Risk Level */}
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">Risk Level</p>
                  <RiskBadge level={lastDecision.riskLevel} />
                </div>
              </div>

              {/* Failure Probability */}
              {lastDecision.prediction && (
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">Failure Probability</p>
                    <p className={`text-sm font-bold ${
                      lastDecision.prediction.failureProbability > 0.75 ? "text-destructive"
                      : lastDecision.prediction.failureProbability > 0.5 ? "text-warning"
                      : "text-accent"
                    }`}>
                      {formatPercent(lastDecision.prediction.failureProbability)}
                    </p>
                  </div>
                </div>
              )}

              {/* Root Cause */}
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-[10px] text-muted-foreground mb-1">Root Cause</p>
                <p className="text-xs text-foreground leading-relaxed">
                  {lastDecision.rootCause.slice(0, 120)}...
                </p>
              </div>

              {/* Business Impact */}
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-[10px] text-muted-foreground mb-1">Business Impact</p>
                <p className="text-xs text-warning/80">{lastDecision.businessImpact}</p>
              </div>

              {/* Recommended Actions */}
              {lastDecision.recommendedActions && lastDecision.recommendedActions.length > 0 && (
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Recommended Actions</p>
                  <div className="space-y-1.5">
                    {lastDecision.recommendedActions.slice(0, 3).map((action, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
