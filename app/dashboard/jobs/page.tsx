import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { RunAgentButton } from "@/components/dashboard/run-agent-button";
import { JobsFilterToolbar } from "@/components/jobs/jobs-found-toolbar";
import { JobsResultsSection } from "@/components/jobs/jobs-results-section";
import { HuntStatusBadge } from "@/components/dashboard/hunt-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getAuthUser } from "@/lib/supabase/server";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { parseJobFilters } from "@/lib/jobs/parse-filters";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await getAuthUser();
  if (!user) return null;

  const params = await searchParams;
  const filters = parseJobFilters(params);

  let totalJobs = 0;
  let totalMatches = 0;
  let profile = null;
  try {
    [totalJobs, totalMatches, profile] = await Promise.all([
      jobRepository.count(),
      jobMatchRepository.findForUser(user.id).then((m) => m.length),
      profileRepository.getByUserId(user.id),
    ]);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header
        title="Jobs Found"
        description="AI-scored opportunities from your autonomous job search"
      />
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {totalMatches > 0
              ? `${totalMatches} total matches · ${totalJobs} jobs in database`
              : "Run a search to discover and score new opportunities."}
          </p>
          <RunAgentButton label="Search & score jobs" />
        </div>

        <JobsFilterToolbar basePath="/dashboard/jobs" variant="jobs" />
        <HuntStatusBadge profile={profile} />

        <Suspense
          key={JSON.stringify(filters)}
          fallback={
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <JobsResultsSection
            userId={user.id}
            filters={filters}
            totalMatches={totalMatches}
            emptyDescription={
              totalMatches === 0 && totalJobs === 0
                ? "Click “Search & score jobs” to fetch listings from job boards and AI-score them against your profile."
                : totalMatches === 0 && totalJobs > 0
                  ? `${totalJobs} jobs in database but none scored yet. Run “Search & score jobs”.`
                  : undefined
            }
          />
        </Suspense>
      </div>
    </>
  );
}
