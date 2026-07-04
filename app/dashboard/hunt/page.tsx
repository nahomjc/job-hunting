import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { HuntSettingsControls } from "@/components/dashboard/hunt-settings-controls";
import { HuntPipelinePanel } from "@/components/dashboard/hunt-pipeline-panel";
import { HuntBusinessLeadsPanel } from "@/components/dashboard/hunt-business-leads-panel";
import { HuntJobsPageTabs } from "@/components/dashboard/jobs-page-tabs";
import { getInitialHuntState, getCountryLabel, getHuntModeLabel } from "@/lib/jobs/hunt-preferences";
import { countProvidersForHunt, ethiopiaProvidersEnabled } from "@/lib/jobs/providers";
import { JobsFilterToolbar } from "@/components/jobs/jobs-found-toolbar";
import { JobsSortBar } from "@/components/jobs/jobs-sort-bar";
import { JobsResultsSection } from "@/components/jobs/jobs-results-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { parseHuntResultsFilters } from "@/lib/jobs/parse-filters";
import { getLastHuntSummary } from "@/lib/hunt/last-run";
import { userHasCv } from "@/lib/profile/has-cv";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { getLocalBusinessLeads } from "@/app/actions/business-leads";

interface HuntPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function HuntControlsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function TabsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export default async function LocalHuntPage({ searchParams }: HuntPageProps) {
  const user = await getAuthUser();
  if (!user) return null;

  const params = await searchParams;

  let profile = null;
  let totalMatches = 0;
  let lastRun = null;
  let hasCv = false;
  let businessLeads: Awaited<ReturnType<typeof getLocalBusinessLeads>> = [];
  try {
    [profile, totalMatches, lastRun, hasCv] = await Promise.all([
      profileRepository.getByUserId(user.id),
      jobMatchRepository.findForUser(user.id).then((m) => m.length),
      getLastHuntSummary(user.id),
      userHasCv(user.id),
    ]);
  } catch {
    // DB not configured
  }

  const filters = parseHuntResultsFilters(params);
  const huntState = getInitialHuntState(profile);
  const providerCount = countProvidersForHunt(profile, huntState.huntCountry);
  const ethiopiaBoards = ethiopiaProvidersEnabled(profile, huntState.huntCountry);
  const countryLabel = getCountryLabel(huntState.huntCountry);

  try {
    if (huntState.huntCountry) {
      businessLeads = await getLocalBusinessLeads(huntState.huntCountry);
    }
  } catch {
    // migration pending or DB unavailable
  }

  return (
    <>
      <Header
        title="Local Job Hunt"
        description="Search latest jobs by country — remote roles open to your region or on-site local openings"
      />
      <div className="flex-1 p-4 md:p-8 space-y-6">
        <div className="rounded-xl border border-border/80 bg-muted/20 p-6 space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <Suspense fallback={<HuntControlsFallback />}>
              <HuntSettingsControls
                initialCountry={huntState.huntCountry}
                initialMode={huntState.huntMode}
              />
            </Suspense>
            <Button asChild variant="outline" size="sm" className="shrink-0 lg:mt-7">
              <Link href="/dashboard/settings?tab=hunt">
                <Settings className="h-4 w-4" />
                Services & more
              </Link>
            </Button>
          </div>
        </div>

        <Suspense fallback={<TabsFallback />}>
          <HuntJobsPageTabs
            basePath="/dashboard/hunt"
            results={
              <section id="hunt-results" className="scroll-mt-24 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Hunt results</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalMatches > 0
                        ? `${totalMatches} scored jobs — sort by date or best match, then filter below`
                        : "Start a country hunt in the Country hunt tab — results appear here after scoring."}
                    </p>
                  </div>
                  <Suspense fallback={<Skeleton className="h-8 w-52" />}>
                    <JobsSortBar
                      basePath="/dashboard/hunt"
                      defaultSort="date"
                      scrollAnchor="hunt-results"
                    />
                  </Suspense>
                </div>
                <JobsFilterToolbar basePath="/dashboard/hunt" variant="hunt" hideSort />
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
                    basePath="/dashboard/hunt"
                    scrollAnchor="hunt-results"
                    emptyDescription={
                      totalMatches === 0
                        ? "Go to the Country hunt tab to scan job boards and AI-score matches."
                        : "No jobs match your filters. Clear country filter or try “Any” hunt mode."
                    }
                  />
                </Suspense>
              </section>
            }
            search={
              <>
                <HuntPipelinePanel
                  countryLabel={countryLabel}
                  modeLabel={getHuntModeLabel(huntState.huntMode)}
                  providerCount={providerCount}
                  ethiopiaBoardsEnabled={ethiopiaBoards}
                  lastRun={lastRun}
                  hasCv={hasCv}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border/60 p-4">
                    <h3 className="text-sm font-medium">How job hunt works</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      The agent scans {providerCount}+ boards, filters by {countryLabel} and your
                      hunt mode, saves new listings, then AI-scores them. Results in the Results tab
                      show every scored job.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-4">
                    <h3 className="text-sm font-medium">Jobs Found vs Local Hunt</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      This page targets a specific country. For a global profile-based search, use{" "}
                      <Link href="/dashboard/jobs" className="text-primary hover:underline">
                        Jobs Found
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </>
            }
            leads={
              <HuntBusinessLeadsPanel
                countryCode={huntState.huntCountry || undefined}
                countryLabel={countryLabel}
                initialLeads={businessLeads}
              />
            }
          />
        </Suspense>
      </div>
    </>
  );
}
