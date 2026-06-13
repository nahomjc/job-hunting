import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { HuntSettingsControls } from "@/components/dashboard/hunt-settings-controls";
import { HuntPipelinePanel } from "@/components/dashboard/hunt-pipeline-panel";
import { getInitialHuntState, getCountryLabel, getHuntModeLabel } from "@/lib/jobs/hunt-preferences";
import { createDefaultProviders } from "@/lib/jobs/providers";
import { JobsFilterToolbar } from "@/components/jobs/jobs-found-toolbar";
import { JobsResultsSection } from "@/components/jobs/jobs-results-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { parseHuntPageFilters } from "@/lib/jobs/parse-filters";
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

  const filters = parseHuntPageFilters(params, profile);
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

        <HuntPipelinePanel
          countryLabel={getCountryLabel(huntState.huntCountry)}
          modeLabel={getHuntModeLabel(huntState.huntMode)}
          providerCount={providerCount}
          lastRun={lastRun}
        />

        <JobsFilterToolbar basePath="/dashboard/hunt" variant="hunt" />

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
              totalMatches === 0
                ? "Start a country hunt above — results will appear here as jobs are found and scored."
                : "No jobs match your filters. Try a broader country, “Any” hunt mode, or clear filters."
            }
          />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-medium">Remote in country</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Jobs you can do from home but open to candidates in your selected country.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-medium">On-site / local</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Physical offices and local employers in your target country.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <h3 className="text-sm font-medium">Investigate companies</h3>
            <p className="text-xs text-muted-foreground mt-2">
              From Jobs Found or Business Leads — check gaps (website, marketing) and draft pitch letters.
            </p>
            <Button asChild variant="link" className="h-auto p-0 mt-2 text-xs">
              <Link href="/dashboard/leads">Open Business Leads</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
