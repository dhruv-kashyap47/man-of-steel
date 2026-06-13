"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Package,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent } from "@/lib/utils";
import type { PlantIntelligence } from "@/types";

export function MaintenanceIntelligence() {
  const [intel, setIntel] = useState<PlantIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/intelligence")
      .then((r) => r.json())
      .then(setIntel)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader badge="Real-Time Intelligence" title="Maintenance Intelligence" subtitle="Loading..." />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!intel) return null;

  const criticalWarnings = intel.earlyWarnings.filter((w) => w.severity === "critical").length;

  return (
    <div>
      <PageHeader
        badge="Real-Time Intelligence"
        title="Maintenance Intelligence"
        subtitle="Early warnings · Bottlenecks · Risk escalations · Plant health"
      />

      <div className="space-y-8 p-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hud-panel-accent">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Early Warnings</p>
                <p className="text-2xl font-bold text-destructive">{intel.earlyWarnings.length}</p>
                {criticalWarnings > 0 && (
                  <p className="text-[10px] text-destructive">{criticalWarnings} critical</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="hud-panel-accent">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bottlenecks</p>
                <p className="text-2xl font-bold text-warning">{intel.bottlenecks.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hud-panel-accent">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spare Shortages</p>
                <p className="text-2xl font-bold text-accent">{intel.spareShortages.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hud-panel-accent">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Escalations</p>
                <p className="text-2xl font-bold text-success">{intel.riskEscalations.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Early Warnings */}
          <Card className="hud-panel-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Early Failure Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intel.earlyWarnings.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-lg border px-4 py-3",
                    w.severity === "critical" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={w.severity === "critical" ? "destructive" : "warning"} className="text-[10px]">
                      {w.warning_type.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {(w.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{w.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>Current: {w.current_value}</span>
                    <span>Threshold: {w.threshold}</span>
                    <span>Est. {w.days_to_threshold} days to threshold</span>
                  </div>
                </motion.div>
              ))}
              {intel.earlyWarnings.length === 0 && (
                <p className="text-xs text-muted-foreground">No early warnings at this time.</p>
              )}
            </CardContent>
          </Card>

          {/* Bottlenecks */}
          <Card className="hud-panel-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-warning" />
                Production Bottlenecks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intel.bottlenecks.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={b.severity === "critical" ? "destructive" : "warning"} className="text-[10px]">
                      {b.bottleneck_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Est. ${b.estimated_cost_usd.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{b.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Downtime: {b.estimated_downtime_hours}h — {b.production_impact_description}
                  </p>
                </motion.div>
              ))}
              {intel.bottlenecks.length === 0 && (
                <p className="text-xs text-muted-foreground">No bottlenecks identified.</p>
              )}
            </CardContent>
          </Card>

          {/* Risk Escalations */}
          <Card className="hud-panel-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-accent" />
                Asset Risk Escalations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intel.riskEscalations.map((r, i) => (
                <motion.div
                  key={r.assetId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <p className="text-xs font-medium text-foreground">{r.assetName}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {r.previousRisk} → {r.currentRisk}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{r.reason}</p>
                </motion.div>
              ))}
              {intel.riskEscalations.length === 0 && (
                <p className="text-xs text-muted-foreground">No risk escalations.</p>
              )}
            </CardContent>
          </Card>

          {/* Spare Shortages */}
          <Card className="hud-panel-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-accent" />
                Spare Shortage Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intel.spareShortages.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-lg border px-4 py-3",
                    s.priority === "p1_critical" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground">{s.part_name}</p>
                    <Badge
                      variant={s.priority === "p1_critical" ? "destructive" : s.priority === "p2_high" ? "warning" : "cyan"}
                      className="text-[10px]"
                    >
                      {s.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>Stock: {s.current_stock}/{s.reorder_point}</span>
                    <span>Lead: {s.lead_time_days}d</span>
                  </div>
                  <p className="mt-1 text-[10px] text-foreground">{s.impact_description}</p>
                </motion.div>
              ))}
              {intel.spareShortages.length === 0 && (
                <p className="text-xs text-muted-foreground">No spare shortages.</p>
              )}
            </CardContent>
          </Card>

          {/* Plant Health Ranking */}
          <Card className="hud-panel-accent lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-accent" />
                Plant Health Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {intel.plantHealthRanking.map((h, i) => (
                  <motion.div
                    key={h.assetId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[10px] font-mono text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{h.assetName}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              h.healthScore >= 80 ? "bg-success" : h.healthScore >= 60 ? "bg-warning" : "bg-destructive"
                            )}
                            style={{ width: `${h.healthScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono">{h.healthScore}%</span>
                      </div>
                    </div>
                    {h.trend === "improving" ? (
                      <ArrowUp className="h-3 w-3 text-success" />
                    ) : h.trend === "declining" ? (
                      <ArrowDown className="h-3 w-3 text-destructive" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Backlog Ranking */}
          <Card className="hud-panel-accent lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-accent" />
                Maintenance Backlog Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Rank</th>
                      <th className="px-4 py-3 font-medium">Asset</th>
                      <th className="px-4 py-3 font-medium">Overdue</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intel.backlogRanking.map((b, i) => (
                      <tr key={b.assetId} className="border-b border-border/50">
                        <td className="px-4 py-3 text-[10px] text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 text-xs text-foreground">{b.assetName}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs font-mono",
                            b.overdueHours > 48 ? "text-destructive" : "text-warning"
                          )}>
                            {b.overdueHours}h
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={b.priority === "p1_critical" ? "destructive" : "warning"}
                            className="text-[10px]"
                          >
                            {b.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-muted-foreground">
                            {b.overdueHours > 72 ? "Escalate immediately" : "Schedule this week"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
