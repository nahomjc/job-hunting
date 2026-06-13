import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { SectionPanel } from "@/components/admin/section-panel";
import { StatusPill, planVariant } from "@/components/admin/status-pill";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { AdminCvGradePanel } from "@/components/admin/admin-cv-grade-panel";
import { adminRepository } from "@/lib/repositories/admin-repository";
import { parseStoredCvReview } from "@/lib/cv/cv-review";
import { PLAN_LABELS } from "@/lib/admin/constants";
import type { UserRole } from "@/lib/db/schema";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { id } = await params;
  const detail = await adminRepository.getUserDetail(id);
  if (!detail) notFound();

  const { user, plan, subStatus, profile, jobMatchCount, applicationCount } = detail;
  const cvReview = parseStoredCvReview(
    profile?.preferences as Record<string, unknown> | undefined
  );
  const cvReviewedAt =
    typeof profile?.preferences?.cvReviewedAt === "string"
      ? profile.preferences.cvReviewedAt
      : null;

  return (
    <>
      <AdminHeader
        title={user.email}
        description="User account, CV grade, and access controls"
        badge={user.role === "admin" ? "Admin" : undefined}
      />
      <div className="flex-1 space-y-6 p-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-[13px] text-[hsl(var(--admin-muted))] hover:text-[hsl(var(--admin-foreground))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionPanel title="Account" description="Identity and subscription">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                  Email
                </dt>
                <dd className="font-mono text-[hsl(var(--admin-foreground))]">{user.email}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill variant={user.role === "admin" ? "accent" : "default"}>
                  {user.role}
                </StatusPill>
                <StatusPill variant={user.blocked ? "danger" : "success"}>
                  {user.blocked ? "Blocked" : "Active"}
                </StatusPill>
                <StatusPill variant={planVariant(plan)}>
                  {PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan ?? "Free"}
                </StatusPill>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                  Joined
                </dt>
                <dd className="text-[hsl(var(--admin-foreground))]">{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                  Last active
                </dt>
                <dd className="text-[hsl(var(--admin-foreground))]">
                  {formatDate(user.lastActiveAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                  Subscription status
                </dt>
                <dd className="text-[hsl(var(--admin-foreground))] capitalize">
                  {subStatus ?? "—"}
                </dd>
              </div>
              {user.blocked && user.blockedReason && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                    Block reason
                  </dt>
                  <dd className="text-[hsl(var(--admin-foreground))]">{user.blockedReason}</dd>
                </div>
              )}
            </dl>
          </SectionPanel>

          <SectionPanel title="Profile & activity" description="Hunt profile snapshot">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                  Name
                </dt>
                <dd className="text-[hsl(var(--admin-foreground))]">
                  {profile?.fullName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                  Experience
                </dt>
                <dd className="text-[hsl(var(--admin-foreground))]">
                  {profile?.yearsOfExperience != null
                    ? `${profile.yearsOfExperience} years`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                  Skills
                </dt>
                <dd className="text-[hsl(var(--admin-foreground))]">
                  {(profile?.skills ?? []).slice(0, 12).join(", ") || "—"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                    Job matches
                  </p>
                  <p className="font-mono text-xl font-semibold text-[hsl(var(--admin-foreground))]">
                    {jobMatchCount}
                  </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--admin-muted))]">
                    Applications
                  </p>
                  <p className="font-mono text-xl font-semibold text-[hsl(var(--admin-foreground))]">
                    {applicationCount}
                  </p>
                </div>
              </div>
            </dl>
          </SectionPanel>

          <SectionPanel title="Admin actions" description="Role and access">
            <UserAdminActions
              userId={user.id}
              currentRole={user.role as UserRole}
              blocked={user.blocked}
              blockedReason={user.blockedReason}
            />
          </SectionPanel>
        </div>

        <SectionPanel
          title="CV professional grade"
          description="AI score from the candidate's last CV upload"
        >
          {cvReview ? (
            <AdminCvGradePanel review={cvReview} reviewedAt={cvReviewedAt} />
          ) : (
            <p className="text-sm text-[hsl(var(--admin-muted))]">
              No CV grade yet — user has not uploaded a resume in Settings.
            </p>
          )}
        </SectionPanel>
      </div>
    </>
  );
}
