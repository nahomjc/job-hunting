"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Zap, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AgentStatusCard, type AgentCardData } from "@/components/agents/agent-status-card";
import { AgentLogFeed, type LogFeedItem } from "@/components/agents/agent-log-feed";
import { AgentActivityBackground } from "@/components/agents/agent-activity-background";
import { RunAgentButton } from "@/components/dashboard/run-agent-button";
import { AGENT_DISPLAY } from "@/lib/agents/activity-display";
import { cn } from "@/lib/utils";

interface ActivityStats {
  running: number;
  completed: number;
  failed: number;
  idle: number;
}

interface ActivityResponse {
  agents: (AgentCardData & { type: string })[];
  feed: LogFeedItem[];
  stats: ActivityStats;
  polledAt: string;
}

function mapAgents(data: ActivityResponse["agents"]): AgentCardData[] {
  return data.map((a) => {
    const config = AGENT_DISPLAY[a.type as keyof typeof AGENT_DISPLAY];
    return {
      ...a,
      iconKey: config?.iconKey ?? "search",
      gradient: config?.gradient ?? "",
      glowColor: config?.glowColor ?? "",
    };
  });
}

export function AgentActivityView() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/activity", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load activity");
      const json = (await res.json()) as ActivityResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, data?.stats.running ? 2000 : 5000);
    return () => clearInterval(interval);
  }, [fetchActivity, data?.stats.running]);

  const agents = data ? mapAgents(data.agents) : [];
  const isLive = (data?.stats.running ?? 0) > 0;

  return (
    <div className="relative">
      <AgentActivityBackground />

      <div className="relative space-y-6">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl px-4 py-3"
        >
          <div className="flex items-center gap-2 mr-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Agent Network</p>
              <p className="text-[10px] text-muted-foreground">
                {isLive ? "Agents active" : "All systems idle"}
              </p>
            </div>
          </div>

          <StatPill
            icon={Zap}
            label="Running"
            value={data?.stats.running ?? 0}
            active={isLive}
            className="text-primary"
          />
          <StatPill
            icon={CheckCircle2}
            label="Completed"
            value={data?.stats.completed ?? 0}
            className="text-success"
          />
          <StatPill
            icon={XCircle}
            label="Failed"
            value={data?.stats.failed ?? 0}
            className="text-destructive"
          />
          <StatPill
            icon={Clock}
            label="Idle"
            value={data?.stats.idle ?? 0}
            className="text-muted-foreground"
          />

          <div className="ml-auto">
            <RunAgentButton label="Run agents" />
          </div>
        </motion.div>

        {error && (
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2">
            {error}
          </p>
        )}

        {/* Agent cards grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl border border-border/50 bg-muted/20 animate-pulse"
                />
              ))
            : agents.map((agent, i) => (
                <AgentStatusCard key={agent.type} agent={agent} index={i} />
              ))}
        </div>

        {/* Live log terminal */}
        <AgentLogFeed logs={data?.feed ?? []} isLive={isLive} />

        {data?.polledAt && (
          <p className="text-[10px] text-center text-muted-foreground/50 tabular-nums">
            Last synced {new Date(data.polledAt).toLocaleTimeString()} · auto-refresh{" "}
            {isLive ? "2s" : "5s"}
          </p>
        )}
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  active,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-1.5",
        active && "border-primary/30 bg-primary/5"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", className)} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", className)}>{value}</span>
    </div>
  );
}
