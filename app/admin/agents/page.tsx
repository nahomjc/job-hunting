import { Activity, AlertTriangle, History } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionPanel } from "@/components/admin/section-panel";
import { DataTable } from "@/components/admin/data-table";
import { StatusPill, agentStatusVariant } from "@/components/admin/status-pill";
import { adminRepository } from "@/lib/repositories/admin-repository";

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatAgentType(type: string) {
  return type.replace(/_/g, " ");
}

export default async function AdminAgentsPage() {
  const metrics = await adminRepository.getAgentMetrics();

  return (
    <>
      <AdminHeader
        title="Agent Monitoring"
        description="Running agents, failures, and execution history"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Running Agents"
            value={metrics.runningCount}
            icon={Activity}
          />
          <MetricCard
            label="Failed Tasks"
            value={metrics.failedLast24h}
            sublabel="Last 24 hours"
            icon={AlertTriangle}
          />
          <MetricCard
            label="Completed"
            value={metrics.completedLast24h}
            sublabel="Last 24 hours"
            icon={History}
          />
        </div>

        <SectionPanel title="Running Agents" description="Currently in progress">
          <DataTable
            columns={[
              { key: "agent", label: "Agent" },
              { key: "user", label: "User" },
              { key: "started", label: "Started", mono: true },
              { key: "status", label: "Status" },
            ]}
            rows={metrics.runningAgents.map((a) => ({
              agent: formatAgentType(a.agentType),
              user: a.email ?? "System",
              started: a.startedAt.toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              status: <StatusPill variant="running">running</StatusPill>,
            }))}
            emptyMessage="No agents currently running"
          />
        </SectionPanel>

        <SectionPanel title="Failed Tasks" description="Recent agent failures">
          <DataTable
            columns={[
              { key: "agent", label: "Agent" },
              { key: "user", label: "User" },
              { key: "error", label: "Error" },
              { key: "time", label: "Time", mono: true },
            ]}
            rows={metrics.failedTasks.map((t) => ({
              agent: formatAgentType(t.agentType),
              user: t.email ?? "System",
              error: (
                <span className="max-w-xs truncate text-red-400" title={t.error ?? undefined}>
                  {t.error ?? "Unknown error"}
                </span>
              ),
              time: t.startedAt.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))}
            emptyMessage="No failed tasks"
          />
        </SectionPanel>

        <SectionPanel title="Execution History" description="Latest 50 agent runs">
          <DataTable
            columns={[
              { key: "agent", label: "Agent" },
              { key: "status", label: "Status" },
              { key: "duration", label: "Duration", mono: true },
              { key: "user", label: "User" },
              { key: "started", label: "Started", mono: true },
            ]}
            rows={metrics.executionHistory.map((e) => ({
              agent: formatAgentType(e.agentType),
              status: (
                <StatusPill variant={agentStatusVariant(e.status)}>{e.status}</StatusPill>
              ),
              duration: formatDuration(e.durationMs),
              user: e.email ?? "System",
              started: e.startedAt.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))}
          />
        </SectionPanel>
      </div>
    </>
  );
}
