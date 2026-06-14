"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Activity,
  Brain,
  ChevronRight,
  Zap,
  Search,
  Shield,
  ArrowUpRight,
  Clock,
  Gauge,
  DollarSign,
  Timer,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { HealthGauge } from "@/components/shared/health-gauge";
import { MetricCard } from "@/components/shared/metric-card";
import { SeverityBadge, StatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/config";
import { formatPercent } from "@/lib/utils";
import { MACHINE_TYPE_LABELS } from "@/types";
import type { MissionControlData, RootCauseItem } from "@/types";
import type { Asset, AIInsight } from "@/types/database";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const start = prevRef.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 800;
    const startTime = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = value;
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

export function MissionControlDashboard() {
  const [data, setData] = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mission-control")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-accent"
        >
          Initializing Mission Control...
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const criticalCount = data.criticalAssets.length;
  const downtimePrevented = data.failureForecasts
    .filter((p) => p.failure_probability < 0.4)
    .reduce((s, p) => s + p.remaining_useful_life_hours, 0);
  const costSavings = data.failureForecasts
    .filter((p) => p.failure_probability < 0.5)
    .length * 120;

  return (
    <div>
      <PageHeader
        badge="Command Center"
        title="Mission Control"
        subtitle={`${APP_CONFIG.plantName} ▸ Real-time plant health and AI insights`}
        actions={
          <Badge variant="cyan" className="gap-1">
            <Activity className="h-3 w-3" /> LIVE
          </Badge>
        }
      />

      <div className="space-y-6 p-8">
        {/* Top metrics row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <MetricCard
            title="Active Alerts"
            value={<AnimatedCounter value={data.activeAlerts} />}
            subtitle={`${data.recentAlerts.filter((a) => a.severity === "critical").length} critical`}
            icon={AlertTriangle}
            variant={data.activeAlerts > 3 ? "critical" : "default"}
          />
          <MetricCard
            title="Active Risk Count"
            value={<AnimatedCounter value={criticalCount} />}
            subtitle="Assets requiring attention"
            icon={Shield}
            variant="critical"
          />
          <MetricCard
            title="Downtime Prevented"
            value={<AnimatedCounter value={downtimePrevented} suffix="h" />}
            subtitle="Cumulative RUL on low-risk assets"
            icon={Timer}
            variant="accent"
          />
          <MetricCard
            title="Cost Savings"
            value={<><DollarSign className="h-3 w-3 inline -ml-1" /><AnimatedCounter value={costSavings} suffix="K" /></>}
            subtitle="Estimated from prevented failures"
            icon={DollarSign}
            variant="accent"
          />
        </motion.div>

        {/* Plant health + Critical assets */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-6 lg:grid-cols-3"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <Card className="hud-panel-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-accent" />
                  Plant Health Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-6">
                <HealthGauge score={data.healthScore} size="lg" />
                <p className="mt-4 text-center text-sm text-muted-foreground">{data.plant.name}</p>
                <p className="text-xs text-muted-foreground">{data.plant.location}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Critical Assets</CardTitle>
                <Link href="/asset-explorer" className="text-xs text-accent hover:underline">
                  View all →
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.criticalAssets.map((asset: Asset, i: number) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link href={`/asset-explorer?id=${asset.id}`}>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3 transition-colors hover:border-accent/30 hover:bg-accent/5">
                        <div className="flex items-center gap-3">
                          <HealthGauge score={asset.health_score} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {asset.serial_number} · {MACHINE_TYPE_LABELS[asset.machine_type]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={asset.status} />
                          <RiskBadge level={asset.risk_level} />
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Live Event Feed + Failure Forecasts + AI Insights */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Live Event Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-success" />
                Live Event Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {data.recentAlerts.slice(0, 8).map((alert, idx) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
                    alert.severity === "critical"
                      ? "border-destructive/30 bg-destructive/5"
                      : alert.severity === "warning"
                        ? "border-warning/30 bg-warning/5"
                        : "border-border"
                  }`}
                >
                  <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    alert.severity === "critical" ? "text-destructive" : "text-warning"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium truncate">{alert.title}</p>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    {alert.asset && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {alert.asset.name}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Failure Forecasts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                Failure Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.failureForecasts.slice(0, 5).map((pred, idx) => {
                const asset = data.criticalAssets.find((a) => a.id === pred.asset_id) ??
                  data.recentAlerts.find((a) => a.asset_id === pred.asset_id)?.asset;
                return (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:border-warning/20"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {(asset as Asset | undefined)?.name ?? "Asset"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pred.predicted_failure_mode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        pred.failure_probability > 0.75 ? "text-destructive"
                        : pred.failure_probability > 0.5 ? "text-warning"
                        : "text-accent"
                      }`}>
                        {formatPercent(pred.failure_probability)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        RUL: {pred.remaining_useful_life_hours.toLocaleString()}h
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {data.failureForecasts.length > 5 && (
                <p className="text-[10px] text-center text-muted-foreground">
                  +{data.failureForecasts.length - 5} more forecasts
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Insights Panel */}
          <Card className="hud-panel-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.insights.slice(0, 4).map((insight: AIInsight, idx: number) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -1 }}
                  className="rounded-lg border border-accent/10 bg-accent/5 px-4 py-3 transition-colors hover:border-accent/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <Badge variant="cyan" className="shrink-0 text-[10px]">
                      P{insight.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{insight.summary}</p>
                  {insight.impact && (
                    <p className="mt-1 text-xs text-warning/80">{insight.impact}</p>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Root Cause Intelligence Panel */}
        <Card className="hud-panel-accent">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4 text-accent" />
              Root Cause Intelligence
            </CardTitle>
            <Badge variant="cyan" className="text-[10px]">
              Ranked by confidence
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.rootCauses.map((rc: RootCauseItem, i: number) => (
              <motion.div
                key={`${rc.assetId}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-lg border border-border bg-secondary/20 px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                      <Link href={`/asset-explorer?id=${rc.assetId}`} className="text-sm font-medium text-accent hover:underline">
                        {rc.assetName}
                      </Link>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <span className={`text-xs font-bold ${
                        rc.confidence >= 85 ? "text-accent"
                        : rc.confidence >= 70 ? "text-warning"
                        : "text-muted-foreground"
                      }`}>
                        {rc.confidence}% confidence
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{rc.likelyCause}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rc.evidence.map((e: string, j: number) => (
                        <span key={j} className="rounded-md bg-accent/5 px-2 py-0.5 text-[10px] text-muted-foreground border border-accent/10">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-3 flex flex-col items-end">
                    <span className={`text-sm font-bold ${
                      rc.failureProbability > 0.75 ? "text-destructive"
                      : rc.failureProbability > 0.5 ? "text-warning"
                      : "text-accent"
                    }`}>
                      {formatPercent(rc.failureProbability)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">failure prob</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Executive Insights */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <MetricCard
            title="Top Risk Asset"
            value={data.executiveInsights?.topRiskAsset?.name ?? "N/A"}
            subtitle={`${data.executiveInsights?.topRiskAsset ? formatPercent(data.executiveInsights.topRiskAsset.probability) + ' failure probability' : ''}`}
            icon={AlertTriangle}
            variant="critical"
          />
          <MetricCard
            title="Most Improved"
            value={data.executiveInsights?.mostImprovedAsset ?? "N/A"}
            subtitle="Health score trending upward"
            icon={ArrowUpRight}
            variant="accent"
          />
          <MetricCard
            title="Immediate Attention"
            value={data.executiveInsights?.immediateAttentionAsset?.name ?? "N/A"}
            subtitle={`Health: ${data.executiveInsights?.immediateAttentionAsset?.health ?? 0}%`}
            icon={Shield}
            variant="critical"
          />
          <MetricCard
            title="Projected Downtime"
            value={data.executiveInsights ? `${data.executiveInsights.projectedDowntimeRisk}h` : "N/A"}
            subtitle={`Avg health: ${data.executiveInsights?.avgHealthScore ?? 0}%`}
            icon={Clock}
            variant="default"
          />
        </motion.div>

        {/* Active Alerts table */}
        <Card className={data.recentAlerts.some((a) => a.severity === "critical") ? "hud-panel-critical" : ""}>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentAlerts.map((alert) => {
              const escalationLevel =
                alert.severity === "critical"
                  ? data.rootCauses?.some((rc) => rc.assetId === alert.asset_id && rc.failureProbability > 0.8)
                    ? "shutdown-risk"
                    : "critical"
                  : alert.severity === "warning" ? "warning" : "info";
              const escalationLabel =
                escalationLevel === "shutdown-risk" ? "Shutdown Risk"
                : escalationLevel === "critical" ? "Critical"
                : escalationLevel === "warning" ? "Warning"
                : "Info";
              return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                  escalationLevel === "shutdown-risk"
                    ? "shutdown-risk"
                    : alert.severity === "critical"
                    ? "border-destructive/30 bg-destructive/5 pulse-critical"
                    : "border-border"
                }`}
              >
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    escalationLevel === "shutdown-risk" || alert.severity === "critical" ? "text-destructive" : "text-warning"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <SeverityBadge severity={alert.severity} />
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      escalationLevel === "shutdown-risk" ? "bg-destructive/20 text-destructive border border-destructive/40"
                      : escalationLevel === "critical" ? "bg-destructive/10 text-destructive"
                      : escalationLevel === "warning" ? "bg-warning/10 text-warning"
                      : "bg-accent/10 text-accent"
                    }`}>
                      {escalationLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{alert.description}</p>
                  {alert.asset && (
                    <p className="mt-1 text-xs text-accent/70">
                      {alert.asset.name} ({alert.asset.serial_number})
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
