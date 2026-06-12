import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, RISK_LABELS, SEVERITY_LABELS } from "@/types";

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "operational" ? "success"
    : status === "critical" ? "destructive"
    : status === "degraded" ? "warning"
    : status === "maintenance" ? "cyan"
    : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function RiskBadge({ level }: { level: string }) {
  const variant =
    level === "low" ? "success"
    : level === "medium" ? "warning"
    : level === "high" ? "warning"
    : "destructive";
  return <Badge variant={variant}>{RISK_LABELS[level] ?? level}</Badge>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const variant =
    severity === "info" ? "cyan"
    : severity === "warning" ? "warning"
    : "destructive";
  return <Badge variant={variant}>{SEVERITY_LABELS[severity] ?? severity}</Badge>;
}
