"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  Globe,

  Zap,
  Radio,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RiskBadge } from "@/components/shared/status-badge";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import type { Asset, CopilotMessage } from "@/types/database";
import type { AgentDecision } from "@/types";

const SUGGESTED_QUERIES = [
  "Hi! What can you help me with?",
  "What is causing the elevated vibration on Blast Furnace Fan A?",
  "Predict failure probability for the hydraulic pump",
  "What are the latest trends in predictive maintenance?",
  "What-if: vibration increases to 8 mm/s on the rolling mill",
];

const AGENT_ORDER = ["planner", "knowledge", "prediction", "webSearch", "decision"];

const AGENT_ICONS: Record<string, React.ElementType> = {
  planner: Target,
  knowledge: BookOpen,
  prediction: Cpu,
  webSearch: Globe,
  decision: Brain,
};

const AGENT_LABELS: Record<string, string> = {
  planner: "Planning",
  knowledge: "Knowledge",
  prediction: "Prediction",
  webSearch: "Web Search",
  decision: "Decision",
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  planner: "Analyzing intent",
  knowledge: "Retrieving documents",
  prediction: "Calculating risk",
  webSearch: "Searching web",
  decision: "Generating response",
};

function AgentPipelineNode({
  icon: Icon,
  label,
  description,
  state,
  index,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  state: "idle" | "processing" | "done" | "skipped";
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, ease: "easeOut" }}
      className={`relative mb-3 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-500 ${
        state === "processing"
          ? "border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]"
          : state === "done"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : state === "skipped"
              ? "border-border/30 opacity-30"
              : "border-border opacity-40"
      }`}
    >
      {state === "processing" && (
        <motion.div
          className="absolute inset-0 rounded-lg border border-cyan-400/20"
          animate={{
            boxShadow: [
              "0 0 0px rgba(6,182,212,0)",
              "0 0 12px rgba(6,182,212,0.15)",
              "0 0 0px rgba(6,182,212,0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ${
          state === "processing"
            ? "bg-cyan-500/20"
            : state === "done"
              ? "bg-emerald-500/20"
              : "bg-secondary"
        }`}
      >
        {state === "processing" && (
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <Icon
          className={`h-4 w-4 transition-colors duration-300 ${
            state === "processing"
              ? "text-cyan-400"
              : state === "done"
                ? "text-emerald-400"
                : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium capitalize transition-colors duration-300 ${
            state === "processing"
              ? "text-cyan-300"
              : state === "done"
                ? "text-emerald-300"
                : "text-muted-foreground"
          }`}
        >
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {state === "processing" ? (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {description}...
            </motion.span>
          ) : state === "done" ? (
            "Complete"
          ) : (
            description
          )}
        </p>
      </div>
      {state === "done" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        </motion.div>
      )}
      {state === "processing" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Radio className="h-3 w-3 text-cyan-400" />
        </motion.div>
      )}
    </motion.div>
  );
}

function TypingDots() {
  return (
    <motion.div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}

export function ChatInterface() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastDecision, setLastDecision] = useState<AgentDecision | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [agentStates, setAgentStates] = useState<Record<string, "idle" | "processing" | "done" | "skipped">>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    fetch("/api/assets").then((r) => r.json()).then((d) => setAssets(d.assets));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgent]);

  const simulateAgents = useCallback(async (invoked: string[]) => {
    const states: Record<string, "idle" | "processing" | "done" | "skipped"> = {};
    AGENT_ORDER.forEach((a) => {
      states[a] = invoked.includes(a) ? "idle" : "skipped";
    });
    setAgentStates({ ...states });

    for (const agent of AGENT_ORDER) {
      if (!invoked.includes(agent)) continue;
      states[agent] = "processing";
      setActiveAgent(agent);
      setAgentStates({ ...states });

      const delay = agent === "webSearch" ? 1800 : agent === "decision" ? 1200 : 600;
      await new Promise((r) => setTimeout(r, delay));

      states[agent] = "done";
      setAgentStates({ ...states });
    }
    setActiveAgent(null);
  }, []);

  const msgIdRef = useRef(0);
  async function sendMessage(query: string) {
    if (!query.trim() || loading || loadingRef.current) return;
    setInput("");
    setLoading(true);
    loadingRef.current = true;

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

    setLastDecision(null);
    setActiveAgent("planner");

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

      const invoked = data.decision?.agentsInvoked ?? ["planner", "decision"];
      simulateAgents(invoked);

      setConversationId(data.conversation.id);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsg.id),
        { ...userMsg, conversation_id: data.conversation.id },
        data.message,
      ]);
      setLastDecision(data.decision);
    } catch {
      setActiveAgent(null);
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
      loadingRef.current = false;
    }
  }

  return (
    <div className="flex h-[calc(100vh)] flex-col">
      <PageHeader
        badge="AI Engineer · Multi-Agent System"
        title="AI Copilot"
        subtitle="Chat · Diagnostics · Web Search · Predictions · Solutions"
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
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(6,182,212,0.1)",
                      "0 0 40px rgba(6,182,212,0.2)",
                      "0 0 20px rgba(6,182,212,0.1)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10"
                >
                  <Zap className="h-7 w-7 text-cyan-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground">
                  MAN OF STEEL AI Copilot
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Multi-agent maintenance intelligence. Diagnostics, predictions,
                  knowledge retrieval, and web research ▸ all in one conversation.
                </p>
                <div className="mt-6 grid max-w-2xl gap-2">
                  {SUGGESTED_QUERIES.map((q, i) => (
                    <motion.button
                      key={q}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendMessage(q)}
                      className="rounded-lg border border-border px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-foreground"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10"
                    >
                      <Bot className="h-4 w-4 text-cyan-400" />
                    </motion.div>
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ delay: 0.3 }}
                        className="mt-3 border-t border-border/30 pt-2"
                      >
                        <p className="text-[10px] uppercase text-muted-foreground">Citations</p>
                        {msg.citations.map((c, i) => (
                          <p key={i} className="text-xs text-cyan-400/70">
                            [{i + 1}] {c.document_title} ({(c.similarity * 100).toFixed(0)}%)
                          </p>
                        ))}
                      </motion.div>
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
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10"
                >
                  <Bot className="h-4 w-4 text-cyan-400" />
                </motion.div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-cyan-400 mb-1">
                    {activeAgent ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="capitalize">{AGENT_LABELS[activeAgent] ?? activeAgent} agent working</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Processing your request</span>
                      </>
                    )}
                  </div>
                  <TypingDots />
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask me anything ▸ diagnostics, web search, or just chat..."
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

        {/* Agent Pipeline Panel */}
        <div className="w-80 shrink-0 border-l border-border p-4 space-y-4 overflow-y-auto">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Agent Pipeline
              </p>
              {loading && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[10px] text-cyan-400"
                >
                  Processing...
                </motion.div>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
              {AGENT_ORDER.map((agent, idx) => {
                const Icon = AGENT_ICONS[agent];
                const state = loading
                  ? agentStates[agent] ?? "idle"
                  : (lastDecision?.agentsInvoked?.includes(agent))
                    ? "done"
                    : "skipped";
                return (
                  <AgentPipelineNode
                    key={agent}
                    icon={Icon}
                    label={AGENT_LABELS[agent]}
                    description={AGENT_DESCRIPTIONS[agent]}
                    state={state}
                    index={idx}
                  />
                );
              })}
            </div>
          </div>

          {lastDecision && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Decision Summary
              </p>

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
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">Risk Level</p>
                  <RiskBadge level={lastDecision.riskLevel} />
                </div>
              </div>

              {lastDecision.prediction && (
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">Failure Probability</p>
                    <motion.p
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                      className={`text-sm font-bold ${
                        lastDecision.prediction.failureProbability > 0.75 ? "text-destructive"
                        : lastDecision.prediction.failureProbability > 0.5 ? "text-warning"
                        : "text-accent"
                      }`}
                    >
                      {formatPercent(lastDecision.prediction.failureProbability)}
                    </motion.p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-[10px] text-muted-foreground mb-1">Root Cause</p>
                <p className="text-xs text-foreground leading-relaxed">
                  {lastDecision.rootCause.slice(0, 120)}...
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-[10px] text-muted-foreground mb-1">Business Impact</p>
                <p className="text-xs text-warning/80">{lastDecision.businessImpact}</p>
              </div>

              {lastDecision.recommendedActions && lastDecision.recommendedActions.length > 0 && (
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Recommended Actions</p>
                  <div className="space-y-1.5">
                    {lastDecision.recommendedActions.slice(0, 3).map((action, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <ChevronRight className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                        <p className="text-xs text-foreground">{action}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {lastDecision.durationMs && (
                <div className="rounded-lg border border-border/50 bg-card/50 px-4 py-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Response time</span>
                    <span className="text-cyan-400/70">{lastDecision.durationMs}ms</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}