import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { HuntSettingsControls } from "@/components/dashboard/hunt-settings-controls";
import { HuntPipelinePanel } from "@/components/dashboard/hunt-pipeline-panel";
import { HuntBusinessLeadsPanel } from "@/components/dashboard/hunt-business-leads-panel";
import { getInitialHuntState, getCountryLabel, getHuntModeLabel } from "@/lib/jobs/hunt-preferences";
import { createDefaultProviders } from "@/lib/jobs/providers";
import { JobsFilterToolbar } from "@/components/jobs/jobs-found-toolbar";
import { JobsSortBar } from "@/components/jobs/jobs-sort-bar";
import { JobsResultsSection } from "@/components/jobs/jobs-results-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { parseHuntResultsFilters } from "@/lib/jobs/parse-filters";
import { getLastHuntSummary } from "@/lib/hunt/last-run";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

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

export default async function LocalHuntPage({ searchParams }: HuntPageProps) {
  const user = await getAuthUser();
  if (!user) return null;

  const params = await searchParams;

  let profile = null;
  let totalMatches = 0;
  let lastRun = null;
  try {
    [profile, totalMatches, lastRun] = await Promise.all([
      profileRepository.getByUserId(user.id),
      jobMatchRepository.findForUser(user.id).then((m) => m.length),
      getLastHuntSummary(user.id),
    ]);
  } catch {
    // DB not configured
  }

  const filters = parseHuntResultsFilters(params);
  const huntState = getInitialHuntState(profile);
  const providerCount = createDefaultProviders().length;

  return (
    <>
      <Header
        title="Local Job Hunt"
        description="Search latest jobs by country — remote roles open to your region or on-site local openings"
      />
      <div className="flex-1 space-y-6 p-4 md:p-8">
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

        <section id="hunt-results" className="scroll-mt-24 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Hunt results</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMatches > 0
                  ? `${totalMatches} scored jobs — sort by date or best match, then filter below`
                  : "Start a country hunt below — results appear here after scoring."}
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
                  ? "Start a country hunt below — scored jobs will appear here, newest first."
                  : "No jobs match your filters. Clear country filter or try “Any” hunt mode."
              }
            />
          </Suspense>
        </section>

        <HuntPipelinePanel
          countryLabel={getCountryLabel(huntState.huntCountry)}
          modeLabel={getHuntModeLabel(huntState.huntMode)}
          providerCount={providerCount}
          lastRun={lastRun}
        />

        <HuntBusinessLeadsPanel
          countryCode={huntState.huntCountry || undefined}
          countryLabel={getCountryLabel(huntState.huntCountry)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-medium">How job hunt works</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              The agent scans {providerCount}+ boards, filters by your country and mode, saves new
              listings, then AI-scores them. Results above show every scored job — not just the
              country filter used during the scan.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-medium">How business leads work</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              We scan Google Maps and OpenStreetMap in your hunt country for hotels, restaurants,
              and shops without a working website — no job hunt required. Each scan returns up to 5
              leads; use Investigate to generate a pitch letter.
            </p>
            <Button asChild variant="link" className="h-auto p-0 mt-2 text-xs">
              <Link href="/dashboard/leads">View saved leads</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
