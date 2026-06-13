"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Clock,
  Wrench,
  Package,
  TrendingUp,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/shared/status-badge";
import { cn, formatPercent, formatHours } from "@/lib/utils";
import { PRIORITY_LEVEL_LABELS, PRIORITY_LEVEL_COLORS } from "@/types";
import type { PriorityData } from "@/types";

export function MaintenancePriorityDashboard() {
  const [priorities, setPriorities] = useState<PriorityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("priorityScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/priority")
      .then((r) => r.json())
      .then((d) => {
        setPriorities(d.priorities);
        setLoading(false);
      });
  }, []);

  const sorted = [...priorities].sort((a, b) => {
    const aVal = a[sortField as keyof PriorityData] ?? 0;
    const bVal = b[sortField as keyof PriorityData] ?? 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "desc" ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    }
    return sortDir === "desc"
      ? (bVal as number) - (aVal as number)
      : (aVal as number) - (bVal as number);
  });

  const p1Count = priorities.filter((p) => p.priorityLevel === "p1_critical").length;
  const p2Count = priorities.filter((p) => p.priorityLevel === "p2_high").length;
  const p3Count = priorities.filter((p) => p.priorityLevel === "p3_medium").length;
  const p4Count = priorities.filter((p) => p.priorityLevel === "p4_low").length;

  const avgScore = priorities.length > 0
    ? Math.round(priorities.reduce((s, p) => s + p.priorityScore, 0) / priorities.length)
    : 0;

  const topBottleneck = priorities
    .filter((p) => p.priorityLevel === "p1_critical" || p.priorityLevel === "p2_high")
    .slice(0, 5);

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader badge="Command Center" title="Maintenance Priority" subtitle="Loading priority data..." />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        badge="Command Center"
        title="Maintenance Priority"
        subtitle="Ranked assets · Bottlenecks · Procurement Risks · Business Impact"
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
                <p className="text-sm text-muted-foreground">P1 — Critical</p>
                <p className="text-2xl font-bold text-destructive">{p1Count}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hud-panel-accent">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
                <Shield className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P2 — High</p>
                <p className="text-2xl font-bold text-warning">{p2Count}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hud-panel-accent">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Priority Score</p>
                <p className="text-2xl font-bold text-accent">{avgScore}/100</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hud-panel-accent">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Risk (P4)</p>
                <p className="text-2xl font-bold text-success">{p4Count}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Distribution */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Ranked Assets Table */}
          <div className="lg:col-span-2">
            <Card className="hud-panel-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowUpDown className="h-4 w-4 text-accent" />
                  Ranked Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Asset</th>
                        <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => toggleSort("priorityScore")}>
                          Score {sortField === "priorityScore" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                        </th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">RUL</th>
                        <th className="px-4 py-3 font-medium">Window</th>
                        <th className="px-4 py-3 font-medium">Procurement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((p, i) => (
                        <motion.tr
                          key={p.assetId}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            "border-b border-border/50 transition-colors hover:bg-accent/5",
                            p.priorityLevel === "p1_critical" && "bg-destructive/5",
                            p.priorityLevel === "p2_high" && "bg-warning/5"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">{p.assetName}</p>
                              <p className="text-[10px] text-muted-foreground">{p.machineType.replace(/_/g, " ")}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 rounded-full bg-border overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    p.priorityScore >= 70 ? "bg-destructive" : p.priorityScore >= 50 ? "bg-warning" : p.priorityScore >= 30 ? "bg-accent" : "bg-success"
                                  )}
                                  style={{ width: `${p.priorityScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold">{p.priorityScore}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                p.priorityLevel === "p1_critical" ? "destructive" :
                                p.priorityLevel === "p2_high" ? "warning" :
                                p.priorityLevel === "p3_medium" ? "cyan" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {PRIORITY_LEVEL_LABELS[p.priorityLevel] ?? p.priorityLevel}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-foreground">
                            {formatHours(p.remainingUsefulLifeHours)}
                          </td>
                          <td className="px-4 py-3 text-xs text-foreground">
                            {p.maintenanceWindow}
                          </td>
                          <td className="px-4 py-3">
                            <p className={cn("text-[10px] font-medium", PRIORITY_LEVEL_COLORS[p.priorityLevel])}>
                              {p.procurementLeadTimeDays}d lead
                            </p>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Priority Score Breakdown */}
            <Card className="hud-panel-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorities.slice(0, 3).map((p, i) => (
                  <div key={p.assetId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{p.assetName}</span>
                      <span className={PRIORITY_LEVEL_COLORS[p.priorityLevel]}>{p.priorityScore}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.priorityScore}%` }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className={cn(
                          "h-full rounded-full",
                          p.priorityLevel === "p1_critical" ? "bg-destructive" :
                          p.priorityLevel === "p2_high" ? "bg-warning" : "bg-accent"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Actions */}
            <Card className="hud-panel-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4 text-accent" />
                  Top Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topBottleneck.map((p, i) => (
                  <div key={p.assetId} className="flex items-start gap-2">
                    <ChevronRight className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      p.priorityLevel === "p1_critical" ? "text-destructive" : "text-warning"
                    )} />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {p.maintenanceWindow} — {p.assetName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.procurementRecommendation.slice(0, 60)}...
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Procurement Risks */}
            <Card className="hud-panel-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-accent" />
                  Procurement Risks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {priorities
                  .filter((p) => p.procurementLeadTimeDays > 60)
                  .slice(0, 4)
                  .map((p) => (
                    <div key={p.assetId} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                      <div>
                        <p className="text-xs text-foreground">{p.assetName}</p>
                        <p className="text-[10px] text-muted-foreground">{p.procurementLeadTimeDays}d lead time</p>
                      </div>
                      <RiskBadge level="high" />
                    </div>
                  ))}
                {priorities.filter((p) => p.procurementLeadTimeDays > 60).length === 0 && (
                  <p className="text-xs text-muted-foreground">No critical procurement risks</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
