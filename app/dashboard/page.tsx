import { Briefcase, Send, Calendar, TrendingUp, Target, Sparkles } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { JobMatchCard } from "@/components/dashboard/job-match-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RunAgentButton } from "@/components/dashboard/run-agent-button";
import { getAuthUser } from "@/lib/supabase/server";
import { analyticsService } from "@/lib/services/analytics-service";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { formatPercent } from "@/lib/utils";

export default async function OverviewPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let stats = {
    totalJobsFound: 0,
    applicationsSent: 0,
    interviewsReceived: 0,
    responseRate: 0,
    offerRate: 0,
    highMatchJobs: 0,
  };
  let topMatches: Awaited<ReturnType<typeof jobMatchRepository.findForUser>> = [];

  try {
    [stats, topMatches] = await Promise.all([
      analyticsService.getDashboardStats(user.id),
      jobMatchRepository.findForUser(user.id, { minScore: 70 }),
    ]);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header
        title="Overview"
        description="Your AI job hunting command center"
      />
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <p className="text-sm text-muted-foreground">
            Agents search job boards every 6 hours and score matches against your profile.
          </p>
          <RunAgentButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Jobs Found" value={stats.totalJobsFound} icon={Briefcase} />
          <StatCard title="Applications" value={stats.applicationsSent} icon={Send} />
          <StatCard title="Interviews" value={stats.interviewsReceived} icon={Calendar} />
          <StatCard title="High Matches" value={stats.highMatchJobs} icon={Target} />
          <StatCard title="Response Rate" value={formatPercent(stats.responseRate)} icon={TrendingUp} />
          <StatCard title="Offer Rate" value={formatPercent(stats.offerRate)} icon={Sparkles} />
        </div>

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
