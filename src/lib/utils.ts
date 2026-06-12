import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value * 100, decimals)}%`;
}

export function formatHours(hours: number): string {
  if (hours >= 1000) return `${formatNumber(hours / 1000, 1)}k hrs`;
  return `${formatNumber(hours, 0)} hrs`;
}

export function getHealthColor(score: number): string {
  if (score >= 80) return "text-cyan-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function getRiskColor(level: string): string {
  switch (level) {
    case "low":
      return "text-cyan-400";
    case "medium":
      return "text-amber-400";
    case "high":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}
