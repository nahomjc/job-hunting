"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AGENT_ICONS } from "./agent-icons";
import { formatRelativeTime } from "@/lib/agents/activity-display";

export interface AgentCardData {
  type: string;
  name: string;
  description: string;
  status: "idle" | "running" | "completed" | "failed" | "pending";
  progress: number;
  latestMessage: string;
  iconKey: "search" | "target" | "file" | "mail";
  gradient: string;
  glowColor: string;
  execution: {
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
  } | null;
}

const STATUS_STYLES = {
  idle: {
    dot: "bg-muted-foreground/40",
    label: "Idle",
    labelClass: "text-muted-foreground",
  },
  running: {
    dot: "bg-primary animate-pulse",
    label: "Running",
    labelClass: "text-primary",
  },
  completed: {
    dot: "bg-success",
    label: "Completed",
    labelClass: "text-success dark:text-[hsl(152,60%,58%)]",
  },
  failed: {
    dot: "bg-destructive",
    label: "Failed",
    labelClass: "text-destructive",
  },
  pending: {
    dot: "bg-warning animate-pulse",
    label: "Pending",
    labelClass: "text-warning",
  },
};

interface AgentStatusCardProps {
  agent: AgentCardData;
  index: number;
}

export function AgentStatusCard({ agent, index }: AgentStatusCardProps) {
  const Icon = AGENT_ICONS[agent.iconKey];
  const statusStyle = STATUS_STYLES[agent.status] ?? STATUS_STYLES.idle;
  const isActive = agent.status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/50 p-5",
        "bg-card/40 backdrop-blur-xl transition-all duration-300",
        isActive && "border-primary/30 shadow-[var(--shadow-glow)]",
      )}
      style={
        isActive ? { boxShadow: `0 0 40px ${agent.glowColor}` } : undefined
      }
    >
      {/* Gradient bg */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          agent.gradient,
        )}
      />

      {/* Scan line animation when running */}
      {isActive && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          animate={{ top: ["0%", "100%"] }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                "bg-background/60 ring-1 ring-white/10 transition-transform duration-300",
                "group-hover:scale-105",
                isActive && "ring-primary/30",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                {agent.name}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                {agent.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("h-2 w-2 rounded-full", statusStyle.dot)} />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                statusStyle.labelClass,
              )}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        <p className="text-xs text-foreground/80 mb-4 min-h-[2rem] line-clamp-2 font-mono leading-relaxed">
          {isActive && (
            <span className="text-primary mr-1.5 animate-pulse">▸</span>
          )}
          {agent.latestMessage}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums font-medium">{agent.progress}%</span>
          </div>
          <Progress
            value={agent.progress}
            className={cn(
              "h-1.5 bg-muted/80",
              agent.status === "failed" && "[&>div]:bg-destructive",
              agent.status === "completed" && "[&>div]:bg-success",
            )}
          />
        </div>

        {agent.execution && (
          <p className="mt-3 text-[10px] text-muted-foreground/70 tabular-nums">
            {agent.status === "running"
              ? `Started ${formatRelativeTime(agent.execution.startedAt)}`
              : agent.execution.durationMs
                ? `Finished in ${(agent.execution.durationMs / 1000).toFixed(1)}s`
                : formatRelativeTime(
                    agent.execution.completedAt ?? agent.execution.startedAt,
                  )}
          </p>
        )}
      </div>
    </motion.div>
  );
}
