"use client";

import { motion } from "framer-motion";
import { cn, getHealthColor } from "@/lib/utils";

interface HealthGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function HealthGauge({ score, size = "md", label, className }: HealthGaugeProps) {
  const dims = { sm: 80, md: 120, lg: 160 }[size];
  const stroke = { sm: 6, md: 8, lg: 10 }[size];
  const radius = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#6C8EFF" : score >= 60 ? "#E6B450" : score >= 40 ? "#E76F51" : "#E76F51";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke="#2E3643"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", getHealthColor(score), {
            "text-lg": size === "sm",
            "text-2xl": size === "md",
            "text-4xl": size === "lg",
          })}>
            {score.toFixed(0)}
          </span>
          {size !== "sm" && (
            <span className="text-[10px] text-muted-foreground">HEALTH</span>
          )}
        </div>
      </div>
      {label && <p className="mt-2 text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}
