"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Report, Asset } from "@/types/database";

export function ReportsCenter() {
  const [reports, setReports] = useState<Report[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState("");

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((d) => setReports(d.reports));
    fetch("/api/assets").then((r) => r.json()).then((d) => {
      setAssets(d.assets);
      setSelectedAsset(d.assets[0]?.id ?? "");
    });
  }, []);

  async function generateReport(type: "incident" | "maintenance" | "executive_summary" | "priority" | "feedback_learning" | "intelligence") {
    setGenerating(type);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, assetId: type !== "executive_summary" ? selectedAsset : undefined }),
      });
      const data = await res.json();
      setReports((prev) => [data.report, ...prev]);
    } finally {
      setGenerating(null);
    }
  }

  function downloadPDF(reportId: string, title: string) {
    const a = document.createElement("a");
    a.href = `/api/reports/${reportId}/pdf`;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    a.click();
  }

  const reportTypes = [
    {
      type: "incident" as const,
      title: "Incident Report",
      description: "Active alerts, failure prediction, and remediation steps for a specific asset.",
      color: "destructive" as const,
    },
    {
      type: "maintenance" as const,
      title: "Maintenance Report",
      description: "Full maintenance history, condition assessment, and predictive analysis.",
      color: "cyan" as const,
    },
    {
      type: "executive_summary" as const,
      title: "Executive Summary",
      description: "Plant-wide health overview, critical assets, and AI insights for leadership.",
      color: "warning" as const,
    },
    {
      type: "priority" as const,
      title: "Priority Report",
      description: "Ranked assets, production bottlenecks, procurement risks, and spare shortages.",
      color: "destructive" as const,
    },
    {
      type: "feedback_learning" as const,
      title: "Feedback Learning Report",
      description: "Model accuracy, recurring failures, root causes, and learning progress.",
      color: "warning" as const,
    },
    {
      type: "intelligence" as const,
      title: "Intelligence Report",
      description: "Early warnings, risk escalations, bottlenecks, and plant health ranking.",
      color: "cyan" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        badge="Intelligence Reports"
        title="Reports Center"
        subtitle="Generate incident reports, maintenance reports, and executive summaries"
      />

      <div className="space-y-8 p-8">
        {/* Asset selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Asset for reports:</label>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.serial_number})</option>
            ))}
          </select>
        </div>

        {/* Generate cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
          {reportTypes.map((rt) => (
            <Card key={rt.type} className="hud-panel-accent">
              <CardHeader>
                <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-accent" />
                  <CardTitle className="normal-case tracking-normal text-base">
                    {rt.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{rt.description}</p>
                <Button
                  variant="hud"
                  className="w-full"
                  onClick={() => generateReport(rt.type)}
                  disabled={generating !== null || (rt.type !== "executive_summary" && !selectedAsset)}
                >
                  {generating === rt.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Generate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report list */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Generated Reports ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reports generated yet. Use the cards above to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium">{report.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleString()} · {report.generated_by}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {report.report_type.replace("_", " ")}
                        </Badge>
                        <Button
                          variant="hud"
                          size="sm"
                          onClick={() => downloadPDF(report.id, report.title)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
