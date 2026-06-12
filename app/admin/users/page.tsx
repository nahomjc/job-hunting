import { Users, UserCheck, CreditCard } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionPanel } from "@/components/admin/section-panel";
import { DataTable } from "@/components/admin/data-table";
import { BarChart } from "@/components/admin/bar-chart";
import { StatusPill, planVariant } from "@/components/admin/status-pill";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { PLAN_LABELS } from "@/lib/admin/constants";
import { formatPercent } from "@/lib/utils";

function formatRelative(date: Date | null) {
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminUsersPage() {
  const metrics = await adminRepository.getUserMetrics();

  const totalSubs = metrics.subscriptionsByPlan.reduce((s, p) => s + p.count, 0);

  return (
    <>
      <AdminHeader
        title="Users"
        description="Account growth, activity, and subscription distribution"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            icon={Users}
          />
          <MetricCard
            label="Active Users"
            value={metrics.activeUsers.toLocaleString()}
            sublabel={`${formatPercent(metrics.activeRate)} of total · 30d window`}
            icon={UserCheck}
          />
          <MetricCard
            label="Subscriptions"
            value={totalSubs.toLocaleString()}
            sublabel={`${metrics.subscriptionsByStatus.find((s) => s.status === "active")?.count ?? 0} active`}
            icon={CreditCard}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionPanel title="Subscriptions by Plan" description="Active plan distribution">
            <BarChart
              data={metrics.subscriptionsByPlan.map((p) => ({
                label: PLAN_LABELS[p.plan as keyof typeof PLAN_LABELS] ?? p.plan,
                value: p.count,
              }))}
            />
          </SectionPanel>
          <SectionPanel title="Subscription Status" description="Billing lifecycle">
            <BarChart
              data={metrics.subscriptionsByStatus.map((s) => ({
                label: s.status.replace("_", " "),
                value: s.count,
              }))}
            />
          </SectionPanel>
        </div>

        <SectionPanel title="Recent Users" description="Latest sign-ups and activity">
          <DataTable
            columns={[
              { key: "email", label: "Email" },
              { key: "plan", label: "Plan" },
              { key: "status", label: "Status" },
              { key: "lastActive", label: "Last Active", mono: true },
              { key: "joined", label: "Joined", mono: true },
            ]}
            rows={metrics.recentUsers.map((u) => ({
              email: u.email,
              plan: (
                <StatusPill variant={planVariant(u.plan)}>
                  {PLAN_LABELS[u.plan as keyof typeof PLAN_LABELS] ?? u.plan ?? "Free"}
                </StatusPill>
              ),
              status: (
                <StatusPill variant={u.status === "active" ? "success" : "warning"}>
                  {u.status ?? "active"}
                </StatusPill>
              ),
              lastActive: formatRelative(u.lastActiveAt),
              joined: u.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            }))}
          />
        </SectionPanel>
      </div>
    </>
  );
}
