import { DollarSign, TrendingDown, CreditCard } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionPanel } from "@/components/admin/section-panel";
import { DataTable } from "@/components/admin/data-table";
import { BarChart, Sparkline } from "@/components/admin/bar-chart";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { PLAN_LABELS } from "@/lib/admin/constants";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function AdminRevenuePage() {
  const metrics = await adminRepository.getRevenueMetrics();

  return (
    <>
      <AdminHeader
        title="Revenue"
        description="MRR, churn, and subscription analytics"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="MRR"
            value={metrics.mrrFormatted}
            sublabel="Monthly recurring revenue"
            icon={DollarSign}
          />
          <MetricCard
            label="Churn Rate"
            value={formatPercent(metrics.churnRate)}
            sublabel={`${metrics.canceledLast30Days} canceled (30d)`}
            icon={TrendingDown}
          />
          <MetricCard
            label="Active Subscriptions"
            value={metrics.activeSubscriptions.toLocaleString()}
            icon={CreditCard}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionPanel title="MRR Trend" description="6-month view">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {metrics.mrrFormatted}
              </p>
              <Sparkline
                data={metrics.mrrTrend.map((m) => m.mrrCents / 100)}
                className="h-10 w-36"
              />
            </div>
            <BarChart
              data={metrics.mrrTrend.map((m) => ({
                label: m.label,
                value: m.mrrCents / 100,
              }))}
              valueFormatter={(n) => formatCurrency(n * 100)}
            />
          </SectionPanel>

          <SectionPanel title="Plan Revenue Breakdown" description="MRR by tier">
            <BarChart
              data={metrics.planBreakdown.map((p) => ({
                label: PLAN_LABELS[p.plan as keyof typeof PLAN_LABELS] ?? p.plan,
                value: p.mrrCents / 100,
                secondary: p.count,
              }))}
              valueFormatter={(n) => formatCurrency(n * 100)}
              secondaryFormatter={(n) => `${n} subs`}
            />
          </SectionPanel>
        </div>

        <SectionPanel title="Subscription Analytics" description="Active plans and revenue contribution">
          <DataTable
            columns={[
              { key: "plan", label: "Plan" },
              { key: "subscribers", label: "Subscribers", mono: true },
              { key: "mrr", label: "MRR", mono: true },
              { key: "arpu", label: "ARPU", mono: true },
            ]}
            rows={metrics.planBreakdown.map((p) => ({
              plan: PLAN_LABELS[p.plan as keyof typeof PLAN_LABELS] ?? p.plan,
              subscribers: p.count.toLocaleString(),
              mrr: formatCurrency(p.mrrCents),
              arpu: p.count > 0 ? formatCurrency(Math.round(p.mrrCents / p.count)) : "—",
            }))}
            emptyMessage="No active subscriptions yet"
          />
        </SectionPanel>
      </div>
    </>
  );
}
