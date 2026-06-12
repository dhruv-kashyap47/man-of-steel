"use client";

import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, badge, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start justify-between border-b border-border px-8 py-6"
    >
      <div>
        {badge && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent"
          >
            {badge}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
