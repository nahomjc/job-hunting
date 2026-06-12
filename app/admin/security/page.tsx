import { LogIn, AlertOctagon, FileText } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionPanel } from "@/components/admin/section-panel";
import { DataTable } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { adminRepository } from "@/lib/repositories/admin-repository";

export default async function AdminSecurityPage() {
  const metrics = await adminRepository.getSecurityMetrics();

  return (
    <>
      <AdminHeader
        title="Security Logs"
        description="Login activity, suspicious behavior, and audit trail"
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Logins (24h)"
            value={metrics.loginsLast24h}
            sublabel={`${metrics.failedLoginsLast24h} failed`}
            icon={LogIn}
          />
          <MetricCard
            label="Suspicious Events"
            value={metrics.suspiciousCount}
            icon={AlertOctagon}
          />
          <MetricCard
            label="Audit Logs (7d)"
            value={metrics.auditCountLast7Days}
            icon={FileText}
          />
        </div>

        <SectionPanel title="Login Activity" description="Recent authentication events">
          <DataTable
            columns={[
              { key: "time", label: "Time", mono: true },
              { key: "email", label: "Email" },
              { key: "ip", label: "IP", mono: true },
              { key: "result", label: "Result" },
              { key: "flags", label: "Flags" },
            ]}
            rows={metrics.loginActivity.map((e) => ({
              time: e.createdAt.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              email: e.email ?? "—",
              ip: e.ipAddress ?? "—",
              result: (
                <StatusPill variant={e.success ? "success" : "danger"}>
                  {e.success ? "success" : "failed"}
                </StatusPill>
              ),
              flags: e.suspicious ? (
                <StatusPill variant="warning">suspicious</StatusPill>
              ) : (
                "—"
              ),
            }))}
            emptyMessage="No login events recorded yet"
          />
        </SectionPanel>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionPanel title="Suspicious Behavior" description="Flagged login patterns">
            <DataTable
              columns={[
                { key: "time", label: "Time", mono: true },
                { key: "email", label: "Email" },
                { key: "ip", label: "IP", mono: true },
              ]}
              rows={metrics.suspiciousEvents.map((e) => ({
                time: e.createdAt.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                email: e.email ?? "—",
                ip: e.ipAddress ?? "—",
              }))}
              emptyMessage="No suspicious events detected"
            />
          </SectionPanel>

          <SectionPanel title="Audit Logs" description="System and user actions">
            <DataTable
              columns={[
                { key: "time", label: "Time", mono: true },
                { key: "action", label: "Action" },
                { key: "user", label: "User" },
              ]}
              rows={metrics.auditLogs.map((a) => ({
                time: a.createdAt.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                action: a.action,
                user: a.email ?? "—",
              }))}
              emptyMessage="No audit logs yet"
            />
          </SectionPanel>
        </div>
      </div>
    </>
  );
}
