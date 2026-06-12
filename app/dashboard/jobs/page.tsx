import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RunAgentButton } from "@/components/dashboard/run-agent-button";
import { JobsFoundTable, type JobTableRow } from "@/components/jobs/jobs-found-table";
import { JobsFoundToolbar } from "@/components/jobs/jobs-found-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { jobRepository } from "@/lib/repositories/job-repository";
import { parseJobFilters } from "@/lib/jobs/parse-filters";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function JobsTableSection({
  userId,
  filters,
  totalJobs,
  totalMatches,
}: {
  userId: string;
  filters: ReturnType<typeof parseJobFilters>;
  totalJobs: number;
  totalMatches: number;
}) {
  const matches = await jobMatchRepository.findForUser(userId, filters);
  const rows: JobTableRow[] = matches.map(({ job, match, application }) => ({
    job,
    match,
    application: application ?? null,
  }));

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No jobs found"
        description={
          totalMatches === 0 && totalJobs === 0
            ? "Click “Search & score jobs” to fetch listings from job boards and AI-score them against your profile."
            : totalMatches === 0 && totalJobs > 0
              ? `${totalJobs} jobs in database but none scored yet. Run “Search & score jobs”.`
              : "No jobs match your search or filters. Try adjusting filters or clearing them."
        }
      />
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Showing <span className="font-medium text-foreground tabular-nums">{rows.length}</span>
        {totalMatches !== rows.length && (
          <> of <span className="tabular-nums">{totalMatches}</span></>
        )}{" "}
        scored {rows.length === 1 ? "job" : "jobs"}
      </p>
      <JobsFoundTable rows={rows} />
    </>
  );
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await getAuthUser();
  if (!user) return null;

  const params = await searchParams;
  const filters = parseJobFilters(params);

  let totalJobs = 0;
  let totalMatches = 0;
  try {
    [totalJobs, totalMatches] = await Promise.all([
      jobRepository.count(),
      jobMatchRepository.findForUser(user.id).then((m) => m.length),
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

        <JobsFoundToolbar />

        <Suspense
          fallback={
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <JobsTableSection
            userId={user.id}
            filters={filters}
            totalJobs={totalJobs}
            totalMatches={totalMatches}
          />
        </Suspense>
      </div>
    </>
  );
}
