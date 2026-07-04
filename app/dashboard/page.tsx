import { Suspense } from "react";
import { Briefcase, Send, Calendar, TrendingUp, Target, Sparkles } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { JobMatchCard } from "@/components/dashboard/job-match-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RunAgentButton } from "@/components/dashboard/run-agent-button";
import { TelegramConnectCard } from "@/components/dashboard/telegram-connect-card";
import { HuntStatusBadge } from "@/components/dashboard/hunt-status-badge";
import { DashboardStatsFilter } from "@/components/dashboard/dashboard-stats-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { analyticsService } from "@/lib/services/analytics-service";
import { getNotificationSettingsDisplay } from "@/lib/services/notification-settings-display";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { formatPercent } from "@/lib/utils";
import { userHasCv } from "@/lib/profile/has-cv";
import { getStatsPeriodLabel, parseStatsPeriod } from "@/lib/analytics/stats-period";

interface OverviewPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function StatsFilterFallback() {
  return <Skeleton className="h-10 w-full max-w-2xl rounded-lg" />;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const user = await getAuthUser();
  if (!user) return null;

  const params = await searchParams;
  const period = parseStatsPeriod(params.period);
  const periodLabel = getStatsPeriodLabel(period);

  let stats = {
    totalJobsFound: 0,
    applicationsSent: 0,
    interviewsReceived: 0,
    responseRate: 0,
    offerRate: 0,
    highMatchJobs: 0,
  };
  let topMatches: Awaited<ReturnType<typeof jobMatchRepository.findForUser>> = [];
  let profile = null;
  let hasCv = false;
  let notificationSettings: Awaited<ReturnType<typeof getNotificationSettingsDisplay>> | null =
    null;

  try {
    [topMatches, profile, hasCv, notificationSettings] = await Promise.all([
      jobMatchRepository.findForUser(user.id, { minScore: 70 }),
      profileRepository.getByUserId(user.id),
      userHasCv(user.id),
      getNotificationSettingsDisplay(user.id),
    ]);
    stats = await analyticsService.getDashboardStats(user.id, period);
  } catch {
    // DB not configured
  }

  const periodHint = `In ${periodLabel.toLowerCase()}`;

  return (
    <>
      <Header
        title="Overview"
        description="Your AI job hunting command center"
      />
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Agents search job boards and score matches against your profile.
            </p>
            <HuntStatusBadge profile={profile} />
          </div>
          <RunAgentButton hasCv={hasCv} />
        </div>

        {notificationSettings && (
          <TelegramConnectCard initial={notificationSettings} />
        )}

        <section className="space-y-4 rounded-xl border border-border/60 bg-card/30 p-4 md:p-5">
          <Suspense fallback={<StatsFilterFallback />}>
            <DashboardStatsFilter />
          </Suspense>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Jobs Found"
              value={stats.totalJobsFound}
              description={period === "all_time" ? "All scored jobs" : periodHint}
              icon={Briefcase}
            />
            <StatCard
              title="Applications"
              value={stats.applicationsSent}
              description={period === "all_time" ? "All applications" : periodHint}
              icon={Send}
            />
            <StatCard
              title="Interviews"
              value={stats.interviewsReceived}
              description={period === "all_time" ? "All interviews" : periodHint}
              icon={Calendar}
            />
            <StatCard
              title="High Matches"
              value={stats.highMatchJobs}
              description={period === "all_time" ? "Score 80+" : periodHint}
              icon={Target}
            />
            <StatCard
              title="Response Rate"
              value={formatPercent(stats.responseRate)}
              description={period === "all_time" ? "All time" : periodHint}
              icon={TrendingUp}
            />
            <StatCard
              title="Offer Rate"
              value={formatPercent(stats.offerRate)}
              description={period === "all_time" ? "All time" : periodHint}
              icon={Sparkles}
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Top Matches</h2>
          {topMatches.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No matches yet"
              description="Complete your profile and run the job hunter agent to discover opportunities."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topMatches.slice(0, 6).map(({ job, match, application }) => (
                <JobMatchCard
                  key={match.id}
                  job={job}
                  match={match}
                  application={application}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
