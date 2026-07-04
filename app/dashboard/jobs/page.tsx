import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { JobSearchPipelinePanel } from "@/components/dashboard/hunt-pipeline-panel";
import { HuntBusinessLeadsPanel } from "@/components/dashboard/hunt-business-leads-panel";
import { HuntJobsPageTabs } from "@/components/dashboard/jobs-page-tabs";
import { JobsFilterToolbar } from "@/components/jobs/jobs-found-toolbar";
import { JobsSortBar } from "@/components/jobs/jobs-sort-bar";
import { JobsResultsSection } from "@/components/jobs/jobs-results-section";
import { HuntStatusBadge } from "@/components/dashboard/hunt-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { getAuthUser } from "@/lib/supabase/server";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { parseJobFilters } from "@/lib/jobs/parse-filters";
import { getInitialHuntState, getCountryLabel } from "@/lib/jobs/hunt-preferences";
import { getLastHuntSummary } from "@/lib/hunt/last-run";
import { userHasCv } from "@/lib/profile/has-cv";
import { countProvidersForHunt, ethiopiaProvidersEnabled } from "@/lib/jobs/providers";
import { getLocalBusinessLeads } from "@/app/actions/business-leads";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await getAuthUser();
  if (!user) return null;

  const params = await searchParams;
  const filters = parseJobFilters(params);

  let totalMatches = 0;
  let profile = null;
  let lastRun = null;
  let hasCv = false;
  let businessLeads: Awaited<ReturnType<typeof getLocalBusinessLeads>> = [];
  try {
    [totalMatches, profile, lastRun, hasCv] = await Promise.all([
      jobMatchRepository.countMatchesForUser(user.id),
      profileRepository.getByUserId(user.id),
      getLastHuntSummary(user.id),
      userHasCv(user.id),
    ]);
  } catch {
    // DB not configured
  }

  const huntCountry = profile ? getInitialHuntState(profile).huntCountry : "";
  const providerCount = countProvidersForHunt(profile, huntCountry);
  const ethiopiaBoards = ethiopiaProvidersEnabled(profile, huntCountry);

  try {
    if (huntCountry) {
      businessLeads = await getLocalBusinessLeads(huntCountry);
    }
  } catch {
    // migration pending or DB unavailable
  }

  return (
    <>
      <Header
        title="Jobs Found"
        description="AI-scored opportunities from your autonomous job search"
      />
      <div className="flex-1 p-4 md:p-8">
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <HuntJobsPageTabs
            basePath="/dashboard/jobs"
          results={
            <section id="jobs-results" className="scroll-mt-24 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Search results</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalMatches > 0
                      ? `${totalMatches} scored matches — sort by date or best match, then filter below`
                      : "Run a search in the Search & score tab — results appear here after each run."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <Suspense fallback={<Skeleton className="h-8 w-52" />}>
                    <JobsSortBar
                      basePath="/dashboard/jobs"
                      defaultSort="score"
                      scrollAnchor="jobs-results"
                    />
                  </Suspense>
                  <HuntStatusBadge profile={profile} />
                </div>
              </div>

              <JobsFilterToolbar basePath="/dashboard/jobs" variant="jobs" hideSort />

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
                  basePath="/dashboard/jobs"
                  scrollAnchor="jobs-results"
                  emptyDescription={
                    totalMatches === 0
                      ? "Go to Search & score to fetch listings from boards and AI-score them."
                      : undefined
                  }
                />
              </Suspense>
            </section>
          }
          search={
            <>
              <JobSearchPipelinePanel
                variant="global"
                providerCount={providerCount}
                ethiopiaBoardsEnabled={ethiopiaBoards}
                lastRun={lastRun}
                basePath="/dashboard/jobs"
                resultsAnchorId="jobs-results"
                onCompleteTab="results"
                hasCv={hasCv}
              />
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
            </>
          }
          leads={
            <HuntBusinessLeadsPanel
              countryCode={huntCountry || undefined}
              countryLabel={getCountryLabel(huntCountry)}
              initialLeads={businessLeads}
            />
          }
          />
        </Suspense>
      </div>
    </>
  );
}
