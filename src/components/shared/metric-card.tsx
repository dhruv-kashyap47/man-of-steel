"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "critical" | "accent";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "hud-panel rounded-lg p-5 cursor-default",
        variant === "critical" && "hud-panel-critical",
        variant === "accent" && "hud-panel-accent",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <motion.div 
            whileHover={{ rotate: 10 }}
            className="rounded-lg border border-border bg-secondary/50 p-2"
          >
            <Icon className="h-4 w-4 text-accent" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
