"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { agentDisplayName, formatLogTime } from "@/lib/agents/activity-display";

export interface LogFeedItem {
  id: string;
  agentType: string;
  message: string;
  level: string;
  progress: number | null;
  createdAt: string;
}

interface AgentLogFeedProps {
  logs: LogFeedItem[];
  isLive?: boolean;
}

const LEVEL_STYLES: Record<string, string> = {
  info: "text-cyan-400/90",
  success: "text-emerald-400/90",
  warn: "text-amber-400/90",
  error: "text-red-400/90",
};

export function AgentLogFeed({ logs, isLive }: AgentLogFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-[hsl(240_6%_4%/0.85)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-muted/10">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Live execution log
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[10px] text-primary font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              LIVE
            </span>
          )}
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* CRT grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      <div
        ref={scrollRef}
        className="relative h-[320px] overflow-y-auto p-4 font-mono text-xs leading-relaxed scrollbar-thin"
      >
        {logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground/60">
            <Terminal className="h-8 w-8 mb-3 opacity-40" />
            <p>No agent activity yet</p>
            <p className="text-[10px] mt-1">Run a job search to see live logs</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i < 3 ? i * 0.05 : 0 }}
                className="flex gap-3 py-1.5 border-b border-border/10 last:border-0 group hover:bg-white/[0.02] -mx-2 px-2 rounded"
              >
                <span className="shrink-0 text-muted-foreground/50 tabular-nums select-none">
                  {formatLogTime(log.createdAt)}
                </span>
                <span className="shrink-0 text-primary/50 select-none w-28 truncate">
                  [{agentDisplayName(log.agentType).replace(" Agent", "")}]
                </span>
                <span className={cn("flex-1", LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info)}>
                  {log.message}
                  {log.progress != null && log.level !== "success" && (
                    <span className="text-muted-foreground/40 ml-2">{log.progress}%</span>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
