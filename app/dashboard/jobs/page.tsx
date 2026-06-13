import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { JobSearchPipelinePanel } from "@/components/dashboard/hunt-pipeline-panel";
import { HuntBusinessLeadsPanel } from "@/components/dashboard/hunt-business-leads-panel";
import { JobsFilterToolbar } from "@/components/jobs/jobs-found-toolbar";
import { JobsResultsSection } from "@/components/jobs/jobs-results-section";
import { HuntStatusBadge } from "@/components/dashboard/hunt-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getAuthUser } from "@/lib/supabase/server";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { parseJobFilters } from "@/lib/jobs/parse-filters";
import { getLastHuntSummary } from "@/lib/hunt/last-run";
import { createDefaultProviders } from "@/lib/jobs/providers";

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
  let lastRun = null;
  try {
    [totalJobs, totalMatches, profile, lastRun] = await Promise.all([
      jobRepository.count(),
      jobMatchRepository.findForUser(user.id).then((m) => m.length),
      profileRepository.getByUserId(user.id),
      getLastHuntSummary(user.id),
    ]);
  } catch {
    // DB not configured
  }

  const providerCount = createDefaultProviders().length;

  return (
    <>
      <Header
        title="Jobs Found"
        description="AI-scored opportunities from your autonomous job search"
      />
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <section id="jobs-results" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Search results</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMatches > 0
                  ? `${totalMatches} scored matches · ${totalJobs} jobs in database · sort & filter below`
                  : "Run a search below — results appear here, newest first after each run."}
              </p>
            </div>
            <HuntStatusBadge profile={profile} />
          </div>

          <JobsFilterToolbar basePath="/dashboard/jobs" variant="jobs" />

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
                  ? "Start a job search below to fetch listings from boards and AI-score them."
                  : totalMatches === 0 && totalJobs > 0
                    ? `${totalJobs} jobs in database but none scored yet. Run “Search & score jobs” below.`
                    : undefined
              }
            />
          </Suspense>
        </section>

        <JobSearchPipelinePanel
          variant="global"
          providerCount={providerCount}
          lastRun={lastRun}
          basePath="/dashboard/jobs"
          resultsAnchorId="jobs-results"
        />

        <HuntBusinessLeadsPanel />

        <div className="rounded-lg border border-border/60 p-4">
          <h3 className="text-sm font-medium">Jobs Found vs Local Hunt</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            This page runs a global search using your profile skills and preferences. For
            country-targeted hunts, use{" "}
            <Link href="/dashboard/hunt" className="text-primary hover:underline">
              Local Job Hunt
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
