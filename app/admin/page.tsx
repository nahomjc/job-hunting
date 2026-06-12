import Link from "next/link";
import { Users, DollarSign, Cpu, Bot, Shield, ArrowRight } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionPanel } from "@/components/admin/section-panel";
import { Sparkline } from "@/components/admin/bar-chart";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { formatCompactNumber, formatPercent, formatUsd } from "@/lib/utils";

const quickLinks = [
  { href: "/admin/users", label: "Users", icon: Users, desc: "Accounts & subscriptions" },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign, desc: "MRR & churn" },
  { href: "/admin/ai-usage", label: "AI Usage", icon: Cpu, desc: "Tokens & costs" },
  { href: "/admin/agents", label: "Agents", icon: Bot, desc: "Execution monitoring" },
  { href: "/admin/security", label: "Security", icon: Shield, desc: "Logins & audit" },
];

export default async function AdminOverviewPage() {
  const { users, revenue, ai, agents, security } =
    await adminRepository.getOverviewMetrics();

  return (
    <>
      <AdminHeader
        title="Admin Overview"
        description="Enterprise metrics across users, revenue, AI, agents, and security"
        badge="Live"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Users"
            value={users.totalUsers.toLocaleString()}
            sublabel={`${formatPercent(users.activeRate)} active (30d)`}
            icon={Users}
          />
          <MetricCard
            label="MRR"
            value={revenue.mrrFormatted}
            sublabel={`${revenue.activeSubscriptions} active subs`}
            icon={DollarSign}
          />
          <MetricCard
            label="AI Cost (30d)"
            value={formatUsd(ai.dailyUsage.slice(-30).reduce((s, d) => s + d.costUsd, 0) || ai.totalCostUsd)}
            sublabel={`${formatCompactNumber(ai.totalTokens)} tokens total`}
            icon={Cpu}
          />
          <MetricCard
            label="Running Agents"
            value={agents.runningCount}
            sublabel={`${agents.failedLast24h} failed (24h)`}
            icon={Bot}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionPanel
            title="MRR Trend"
            description="Monthly recurring revenue"
            className="lg:col-span-2"
          >
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-3xl font-semibold tabular-nums text-[hsl(var(--admin-foreground))]">
                  {revenue.mrrFormatted}
                </p>
                <p className="mt-1 text-[12px] text-[hsl(var(--admin-muted))]">
                  Churn {formatPercent(revenue.churnRate)} · {revenue.canceledLast30Days} canceled (30d)
                </p>
              </div>
              <Sparkline data={revenue.mrrTrend.map((m) => m.mrrCents / 100)} className="h-8 w-32" />
            </div>
            <div className="mt-6 grid grid-cols-6 gap-2">
              {revenue.mrrTrend.map((m) => (
                <div key={m.label} className="text-center">
                  <div
                    className="mx-auto w-full max-w-[40px] rounded-sm bg-[hsl(var(--admin-accent))]"
                    style={{
                      height: `${Math.max(8, (m.mrrCents / Math.max(...revenue.mrrTrend.map((x) => x.mrrCents), 1)) * 64)}px`,
                    }}
                  />
                  <p className="mt-2 text-[10px] text-[hsl(var(--admin-muted))]">{m.label}</p>
                </div>
              ))}
            </div>
          </SectionPanel>

          <SectionPanel title="Security Snapshot" description="Last 24 hours">
            <div className="space-y-4">
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--admin-muted))]">Successful logins</span>
                <span className="font-mono tabular-nums">{security.loginsLast24h}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--admin-muted))]">Failed logins</span>
                <span className="font-mono tabular-nums text-red-400">{security.failedLoginsLast24h}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--admin-muted))]">Suspicious events</span>
                <span className="font-mono tabular-nums text-amber-400">{security.suspiciousCount}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--admin-muted))]">Audit events (7d)</span>
                <span className="font-mono tabular-nums">{security.auditCountLast7Days}</span>
              </div>
            </div>
          </SectionPanel>
        </div>

        <SectionPanel title="Quick Navigation" description="Jump to detailed reports">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center justify-between rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] px-4 py-3 transition-colors hover:border-[hsl(var(--admin-accent)/0.4)] hover:bg-[hsl(var(--admin-accent)/0.05)]"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[hsl(var(--admin-muted))] group-hover:text-[hsl(var(--admin-accent))]" />
                  <div>
                    <p className="text-[13px] font-medium">{label}</p>
                    <p className="text-[11px] text-[hsl(var(--admin-muted))]">{desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[hsl(var(--admin-muted))] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </SectionPanel>
      </div>
    </>
  );
}
