import { Coins, DollarSign, Layers } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionPanel } from "@/components/admin/section-panel";
import { DataTable } from "@/components/admin/data-table";
import { BarChart } from "@/components/admin/bar-chart";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { formatCompactNumber, formatUsd } from "@/lib/utils";

function shortModel(model: string) {
  const parts = model.split("/");
  return parts[parts.length - 1] ?? model;
}

export default async function AdminAiUsagePage() {
  const metrics = await adminRepository.getAiUsageMetrics();

  const costLast30d = metrics.dailyUsage.reduce((s, d) => s + d.costUsd, 0);
  const tokensLast30d = metrics.dailyUsage.reduce((s, d) => s + d.tokens, 0);

  return (
    <>
      <AdminHeader
        title="AI Usage"
        description="Token consumption, API costs, and model distribution"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total Tokens"
            value={formatCompactNumber(metrics.totalTokens)}
            sublabel={`${formatCompactNumber(tokensLast30d)} last 14d`}
            icon={Coins}
          />
          <MetricCard
            label="API Costs"
            value={formatUsd(metrics.totalCostUsd)}
            sublabel={`${formatUsd(costLast30d)} last 14d`}
            icon={DollarSign}
          />
          <MetricCard
            label="Requests (30d)"
            value={metrics.requestsLast30Days.toLocaleString()}
            sublabel={`${metrics.modelUsage.length} models used`}
            icon={Layers}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionPanel title="Daily Token Usage" description="Last 14 days">
            <BarChart
              data={metrics.dailyUsage.map((d) => ({
                label: d.label,
                value: d.tokens,
                secondary: d.costUsd,
              }))}
              valueFormatter={(n) => formatCompactNumber(n)}
              secondaryFormatter={(n) => formatUsd(n)}
            />
          </SectionPanel>

          <SectionPanel title="Model Usage" description="By token volume (30d)">
            <BarChart
              data={metrics.modelUsage.map((m) => ({
                label: shortModel(m.model),
                value: m.tokens,
                secondary: m.costUsd,
              }))}
              valueFormatter={(n) => formatCompactNumber(n)}
              secondaryFormatter={(n) => formatUsd(n)}
            />
          </SectionPanel>
        </div>

        <SectionPanel title="Recent API Calls" description="Latest AI usage events">
          <DataTable
            columns={[
              { key: "time", label: "Time", mono: true },
              { key: "model", label: "Model" },
              { key: "agent", label: "Agent" },
              { key: "tokens", label: "Tokens", mono: true },
              { key: "cost", label: "Cost", mono: true },
              { key: "user", label: "User" },
            ]}
            rows={metrics.recentLogs.map((log) => ({
              time: log.createdAt.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              model: shortModel(log.model),
              agent: log.agentType?.replace("_", " ") ?? "—",
              tokens: log.totalTokens.toLocaleString(),
              cost: formatUsd(log.costUsd),
              user: log.email ?? "System",
            }))}
            emptyMessage="No AI usage logged yet — usage is recorded on each OpenRouter call"
          />
        </SectionPanel>
      </div>
    </>
  );
}
