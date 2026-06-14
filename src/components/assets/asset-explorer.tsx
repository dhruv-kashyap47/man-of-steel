"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Thermometer,
  Gauge,
  RotateCw,
  Vibrate,
  Clock,
  Wrench,
  AlertTriangle,
  Sliders,
  Brain,
  Sparkles,
  TrendingUp,
  SkipBack,
  Activity,
  BarChart3,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { HealthGauge } from "@/components/shared/health-gauge";
import { SensorChart } from "@/components/shared/sensor-chart";
import { StatusBadge, RiskBadge, SeverityBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatHours } from "@/lib/utils";
import { MACHINE_TYPE_LABELS } from "@/types";
import type { Asset, SensorReading, MaintenanceRecord, Alert, FailurePrediction } from "@/types/database";
import type { PredictionResult } from "@/types";

interface WhatIfState {
  temperature_c: number;
  vibration_mm_s: number;
  rpm: number;
}

interface AssetListItem extends Asset {
  plant?: { name: string };
}

function AssetExplorerContent() {
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    asset: Asset;
    sensorReadings: SensorReading[];
    maintenance: MaintenanceRecord[];
    alerts: Alert[];
    prediction: FailurePrediction | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatIf, setWhatIf] = useState<WhatIfState | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<PredictionResult | null>(null);
  const [whatIfActive, setWhatIfActive] = useState(false);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((d) => {
        setAssets(d.assets);
        const paramId = searchParams.get("id");
        setSelectedId(paramId ?? d.assets[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/assets/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        setDetail(d);
        const latest = d.sensorReadings?.[d.sensorReadings.length - 1];
        if (latest) {
          setWhatIf({
            temperature_c: latest.temperature_c,
            vibration_mm_s: latest.vibration_mm_s,
            rpm: latest.rpm,
          });
          setWhatIfResult(null);
          setWhatIfActive(false);
        }
      });
  }, [selectedId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-cyan-400">
        Loading assets...
      </div>
    );
  }

  const asset = detail?.asset;
  const latest = detail?.sensorReadings[detail.sensorReadings.length - 1];

  return (
    <div>
      <PageHeader
        badge="Asset Diagnostics"
        title="Asset Explorer"
        subtitle="Health scores, sensor trends, maintenance history, and failure predictions"
      />

      <div className="flex gap-0 p-0">
        {/* Asset list sidebar */}
        <div className="w-72 shrink-0 border-r border-border p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {assets.length} Assets
          </p>
          <div className="space-y-1">
            {assets.map((a) => (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: assets.indexOf(a) * 0.03 }}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                onClick={() => setSelectedId(a.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedId === a.id
                    ? "border border-accent/30 bg-accent/10"
                    : "hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{a.name}</p>
                  <span className={`text-xs font-bold ${a.health_score < 50 ? "text-destructive" : a.health_score < 70 ? "text-warning" : "text-accent"}`}>
                    {a.health_score.toFixed(0)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {a.serial_number} · {MACHINE_TYPE_LABELS[a.machine_type]}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Asset detail */}
        {asset && detail ? (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-6 p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{asset.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {asset.serial_number} · {MACHINE_TYPE_LABELS[asset.machine_type]} · {asset.location_zone}
                </p>
                <div className="mt-2 flex gap-2">
                  <StatusBadge status={asset.status} />
                  <RiskBadge level={asset.risk_level} />
                </div>
              </div>
              <HealthGauge score={asset.health_score} size="md" />
            </div>

            {/* Key asset metrics */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" />
                  <span className="text-[10px] uppercase text-muted-foreground">Remaining Useful Life</span>
                </div>
                <p className="mt-1 text-lg font-bold text-accent">
                  {detail.prediction ? `${detail.prediction.remaining_useful_life_hours.toLocaleString()}h` : "N/A"}
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-warning" />
                  <span className="text-[10px] uppercase text-muted-foreground">Failure Probability</span>
                </div>
                <p className={`mt-1 text-lg font-bold ${
                  detail.prediction && detail.prediction.failure_probability > 0.75 ? "text-destructive"
                  : detail.prediction && detail.prediction.failure_probability > 0.5 ? "text-warning"
                  : "text-accent"
                }`}>
                  {detail.prediction ? formatPercent(detail.prediction.failure_probability) : "N/A"}
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  <span className="text-[10px] uppercase text-muted-foreground">Asset Criticality</span>
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {asset.risk_level === "critical" ? "Critical"
                    : asset.risk_level === "high" ? "High"
                    : asset.risk_level === "medium" ? "Medium"
                    : "Low"}
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary-foreground" />
                  <span className="text-[10px] uppercase text-muted-foreground">Operating Hours</span>
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {formatHours(asset.operating_hours)}
                </p>
              </Card>
            </div>

            {/* Sensor metrics */}
            {latest && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {[
                  { icon: Thermometer, label: "Temperature", value: `${latest.temperature_c}°C`, color: "text-accent" },
                  { icon: Gauge, label: "Pressure", value: `${latest.pressure_bar} bar`, color: "text-success" },
                  { icon: RotateCw, label: "RPM", value: latest.rpm.toLocaleString(), color: "text-warning" },
                  { icon: Vibrate, label: "Vibration", value: `${latest.vibration_mm_s} mm/s`, color: "text-destructive" },
                  { icon: Clock, label: "Op. Hours", value: formatHours(asset.operating_hours), color: "text-secondary-foreground" },
                ].map((m) => (
                  <Card key={m.label} className="p-4">
                    <div className="flex items-center gap-2">
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                      <span className="text-[10px] uppercase text-muted-foreground">{m.label}</span>
                    </div>
                    <p className={`mt-1 text-lg font-bold ${m.color}`}>{m.value}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* AI Summary Cards */}
            {detail.prediction && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {(() => {
                  const p = detail.prediction;
                  const concern = p.predicted_failure_mode ?? "No immediate concern";
                  const action =
                    p.failure_probability > 0.75
                      ? "Schedule emergency inspection within 24 hours"
                      : p.failure_probability > 0.5
                        ? "Plan predictive maintenance within 7 days"
                        : "Continue routine monitoring";
                  const impact = p.failure_probability > 0.6
                    ? `$${Math.round(p.failure_probability * 3.2).toFixed(1)}M potential loss`
                    : "Within acceptable parameters";
                  return [
                    { icon: Brain, label: "Current Status", value: asset.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()), color: asset.health_score >= 70 ? "text-success" : asset.health_score >= 40 ? "text-warning" : "text-destructive" },
                    { icon: AlertTriangle, label: "Primary Concern", value: concern, color: p.failure_probability > 0.75 ? "text-destructive" : "text-warning" },
                    { icon: Sparkles, label: "Recommended Action", value: action, color: "text-accent" },
                    { icon: TrendingUp, label: "Estimated Impact", value: impact, color: p.failure_probability > 0.6 ? "text-warning" : "text-success" },
                  ].map((c) => (
                    <Card key={c.label} className="p-4">
                      <div className="flex items-center gap-2">
                        <c.icon className={`h-4 w-4 ${c.color}`} />
                        <span className="text-[10px] uppercase text-muted-foreground">{c.label}</span>
                      </div>
                      <p className={`mt-1 text-sm font-semibold leading-tight ${c.color}`}>{c.value}</p>
                    </Card>
                  ));
                })()}
              </div>
            )}

            {/* Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Sensor Trends ▸ 72 Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <SensorChart
                  readings={detail.sensorReadings}
                  metrics={["temperature_c", "vibration_mm_s", "pressure_bar"]}
                />
              </CardContent>
            </Card>

            {/* Sensor Correlation Summary */}
            {detail.sensorReadings.length > 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    Sensor Correlation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {(() => {
                      const readings = detail.sensorReadings;
                      const temps = readings.map((r) => r.temperature_c);
                      const vibs = readings.map((r) => r.vibration_mm_s);
                      const press = readings.map((r) => r.pressure_bar);
                      const tempVib = pearsonCorrelation(temps, vibs);
                      const tempPress = pearsonCorrelation(temps, press);
                      const vibPress = pearsonCorrelation(vibs, press);
                      return [
                        { label: "Temp ÷ Vibration", value: tempVib, color: tempVib > 0.5 ? "text-destructive" : tempVib > 0.3 ? "text-warning" : "text-accent" },
                        { label: "Temp ÷ Pressure", value: tempPress, color: tempPress > 0.5 ? "text-destructive" : tempPress > 0.3 ? "text-warning" : "text-accent" },
                        { label: "Vibration ÷ Pressure", value: vibPress, color: vibPress > 0.5 ? "text-destructive" : vibPress > 0.3 ? "text-warning" : "text-accent" },
                      ].map((c) => (
                        <div key={c.label} className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
                          <p className="text-[10px] uppercase text-muted-foreground">{c.label}</p>
                          <p className={`mt-1 text-lg font-bold ${c.color}`}>
                            {c.value.toFixed(2)}
                          </p>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                Math.abs(c.value) > 0.5 ? "bg-destructive"
                                : Math.abs(c.value) > 0.3 ? "bg-warning"
                                : "bg-accent"
                              }`}
                              style={{ width: `${Math.abs(c.value) * 100}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {Math.abs(c.value) > 0.5 ? "Strong correlation"
                            : Math.abs(c.value) > 0.3 ? "Moderate correlation"
                            : "Weak correlation"}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Failure prediction */}
              {detail.prediction && (
                <Card className={detail.prediction.failure_probability > 0.75 ? "hud-panel-critical" : "hud-panel-accent"}>
                  <CardHeader>
                    <CardTitle>Failure Prediction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Failure Probability</p>
                        <p className={`text-2xl font-bold ${detail.prediction.failure_probability > 0.75 ? "text-destructive" : "text-warning"}`}>
                          {formatPercent(detail.prediction.failure_probability)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Remaining Useful Life</p>
                        <p className="text-2xl font-bold text-accent">
                          {detail.prediction.remaining_useful_life_hours.toLocaleString()}h
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Predicted Failure Mode</p>
                      <p className="text-sm">{detail.prediction.predicted_failure_mode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Model Confidence</p>
                      <p className="text-sm">{formatPercent(detail.prediction.confidence)}</p>
                    </div>
                    <Badge variant="cyan" className="text-[10px]">
                      Model: {detail.prediction.model_version}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Asset Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {detail.alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No alerts for this asset.</p>
                  ) : (
                    detail.alerts.map((alert) => (
                      <div key={alert.id} className="rounded-lg border border-border/30 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <SeverityBadge severity={alert.severity} />
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* What-If Simulator */}
            <Card className="hud-panel-accent">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-accent" />
                  What-If Simulator
                </CardTitle>
                <Badge variant="cyan" className="text-[10px]">Predictive</Badge>
              </CardHeader>
              <CardContent>
                {whatIf && detail.prediction && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        { key: "temperature_c" as const, label: "Temperature", unit: "°C", min: 20, max: 120, step: 1 },
                        { key: "vibration_mm_s" as const, label: "Vibration", unit: "mm/s", min: 0.5, max: 12, step: 0.1 },
                        { key: "rpm" as const, label: "RPM", unit: "", min: 200, max: 4000, step: 50 },
                      ].map((s) => (
                        <div key={s.key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase text-muted-foreground">{s.label}</span>
                            <span className="text-xs font-mono text-accent">{whatIf[s.key]}{s.unit}</span>
                          </div>
                          <input
                            type="range"
                            min={s.min}
                            max={s.max}
                            step={s.step}
                            value={whatIf[s.key]}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setWhatIf((prev) => prev ? { ...prev, [s.key]: val } : null);
                              setWhatIfActive(false);
                              setWhatIfResult(null);
                            }}
                            className="what-if-slider w-full"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          if (!whatIf || !selectedId) return;
                          setWhatIfActive(true);
                          try {
                            const res = await fetch("/api/predict", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                assetId: selectedId,
                                whatIf: {
                                  temperature_c: whatIf.temperature_c,
                                  vibration_mm_s: whatIf.vibration_mm_s,
                                  rpm: whatIf.rpm,
                                },
                              }),
                            });
                            const data = await res.json();
                            setWhatIfResult(data.prediction);
                          } catch {
                            setWhatIfResult(null);
                          }
                        }}
                        className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20 transition-colors"
                      >
                        <SkipBack className="h-3.5 w-3.5" />
                        Run Simulation
                      </button>
                      {whatIfActive && whatIfResult && (
                        <div className="flex items-center gap-4 ml-2">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Risk Change</p>
                            <p className={`text-sm font-bold ${(whatIfResult.failureProbability - (detail.prediction?.failure_probability ?? 0)) > 0.05 ? "text-destructive" : (whatIfResult.failureProbability - (detail.prediction?.failure_probability ?? 0)) < -0.05 ? "text-success" : "text-warning"}`}>
                              {((whatIfResult.failureProbability - (detail.prediction?.failure_probability ?? 0)) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">New RUL</p>
                            <p className="text-sm font-bold text-accent">{whatIfResult.remainingUsefulLifeHours.toLocaleString()}h</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Confidence</p>
                            <p className="text-sm font-bold text-accent">{formatPercent(whatIfResult.confidence)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance history */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Maintenance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detail.maintenance.map((m) => (
                    <div key={m.id} className="flex items-start justify-between border-b border-border/20 pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.performed_at).toLocaleDateString()} · {m.technician} · {m.maintenance_type}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>${m.cost_usd?.toLocaleString()}</p>
                        <p>{m.downtime_hours}h downtime</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Select an asset to view details
          </div>
        )}
      </div>
    </div>
  );
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const sx = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sy = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sxx = x.slice(0, n).reduce((a, b) => a + b * b, 0);
  const syy = y.slice(0, n).reduce((a, b) => a + b * b, 0);
  const sxy = x.slice(0, n).reduce((a, b, i) => a + b * y[i], 0);
  const denom = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
}

export function AssetExplorer() {
  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center text-accent">Loading...</div>}>
      <AssetExplorerContent />
    </Suspense>
  );
}
