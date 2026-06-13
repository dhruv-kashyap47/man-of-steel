"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  Factory,
  Bot,
  FileText,
  BookOpen,
  Activity,
  Search,
  Terminal,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";
import { NAV_ITEMS } from "@/types";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Factory,
  Bot,
  FileText,
  BookOpen,
  ListChecks,
  Activity,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [incidentMode, setIncidentMode] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => setLiveTime(new Date().toLocaleTimeString());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("incident-mode", incidentMode);
  }, [incidentMode]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setPaletteOpen((v) => !v);
      setPaletteQuery("");
      setPaletteIdx(0);
    }
    if (e.key === "Escape") {
      setPaletteOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [paletteOpen]);

  const filteredItems = NAV_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(paletteQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  function navigateTo(href: string) {
    setPaletteOpen(false);
    router.push(href);
  }

  return (
    <div className="hud-background flex min-h-screen relative">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src="/logo.svg" alt="MAN OF STEEL" width={40} height={40} className="h-10 w-10 object-contain" style={{ width: "auto", height: "auto" }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              {APP_CONFIG.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {APP_CONFIG.tagline}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-accent" : "text-secondary-foreground group-hover:text-foreground"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
            <Activity className="h-3.5 w-3.5 text-success" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">System Status</p>
              <p className="text-xs font-medium text-success">Online</p>
            </div>
            <Badge variant="cyan" className="text-[10px]">
              v{APP_CONFIG.version}
            </Badge>
          </div>

          <div className="text-center text-[9px] text-muted-foreground font-mono">
            {liveTime} UTC
          </div>

          <button
            onClick={() => setIncidentMode((v) => !v)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
              incidentMode
                ? "bg-destructive/10 border border-destructive/30 text-destructive"
                : "bg-secondary/30 border border-border/30 text-muted-foreground hover:border-accent/20 hover:text-accent"
            }`}
          >
            <AlertTriangle className={`h-3 w-3 ${incidentMode ? "text-destructive animate-pulse" : ""}`} />
            <span>{incidentMode ? "Incident Mode Active" : "Operational Profile: Production Mode"}</span>
          </button>

          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
            <Terminal className="h-2.5 w-2.5" />
            <span>Cmd+K to navigate</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 pl-64">
        <div className="min-h-screen">{children}</div>
      </main>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="command-palette-overlay"
            onClick={() => setPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.12 }}
              className="command-palette"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center px-4 border-b border-border/60">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={paletteQuery}
                  onChange={(e) => {
                    setPaletteQuery(e.target.value);
                    setPaletteIdx(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setPaletteIdx((i) => Math.min(i + 1, filteredItems.length - 1));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setPaletteIdx((i) => Math.max(i - 1, 0));
                    }
                    if (e.key === "Enter") {
                      if (filteredItems[paletteIdx]) navigateTo(filteredItems[paletteIdx].href);
                    }
                  }}
                  placeholder="Search pages..."
                  className="!border-none !bg-transparent !shadow-none py-4 px-3 text-sm"
                />
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">ESC</span>
              </div>
              <div className="command-palette-results">
                {filteredItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                ) : (
                  filteredItems.map((item, i) => {
                    const Icon = ICON_MAP[item.icon];
                    return (
                      <div
                        key={item.href}
                        className={`command-palette-item ${i === paletteIdx ? "active" : ""}`}
                        onClick={() => navigateTo(item.href)}
                        onMouseEnter={() => setPaletteIdx(i)}
                      >
                        <Icon className="h-4 w-4 text-cyan-400" />
                        <div className="flex-1">
                          <p className="text-sm">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.description}</p>
                        </div>
                        <span className="kbd">↵</span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
