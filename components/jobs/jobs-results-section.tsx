import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { JobsFoundTable, type JobTableRow } from "@/components/jobs/jobs-found-table";
import { JobsPagination } from "@/components/jobs/jobs-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import type { JobMatchFilters } from "@/types";

interface JobsResultsSectionProps {
  userId: string;
  filters: JobMatchFilters;
  totalMatches: number;
  basePath: string;
  scrollAnchor?: string;
  emptyDescription?: string;
  showFilteredCount?: boolean;
}

function PaginationFallback() {
  return <Skeleton className="h-10 w-full max-w-md ml-auto" />;
}

export async function JobsResultsSection({
  userId,
  filters,
  totalMatches,
  basePath,
  scrollAnchor,
  emptyDescription,
  showFilteredCount = true,
}: JobsResultsSectionProps) {
  const result = await jobMatchRepository.findPageForUser(userId, filters);
  const rows: JobTableRow[] = result.rows.map(({ job, match, application }) => ({
    job,
    match,
    application: application ?? null,
  }));

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.minScore ||
      filters.minSalary ||
      filters.maxSalary ||
      filters.location ||
      filters.companySize ||
      filters.experienceLevel ||
      (filters.remoteFilter && filters.remoteFilter !== "all") ||
      filters.huntCountry ||
      (filters.huntMode && filters.huntMode !== "any")
  );

  if (result.total === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No jobs found"
        description={
          emptyDescription ??
          (totalMatches === 0
            ? "Run a hunt to fetch and score jobs, then search and filter here."
            : hasActiveFilters
              ? `No jobs match your filters (${totalMatches} scored total). Clear country or hunt mode filters to see all results.`
              : "No scored jobs yet.")
        }
      />
    );
  }

  const sortLabel =
    filters.sortBy === "date" ? "sorted by newest first" : "sorted by best match";

  return (
    <>
      {showFilteredCount && (
        <p className="text-sm text-muted-foreground mb-4">
          {result.totalPages > 1 ? (
            <>
              Showing{" "}
              <span className="font-medium text-foreground tabular-nums">
                {result.rangeStart}–{result.rangeEnd}
              </span>{" "}
              of <span className="font-medium text-foreground tabular-nums">{result.total}</span>
              {hasActiveFilters && totalMatches !== result.total && (
                <>
                  {" "}
                  (filtered from {totalMatches} total)
                </>
              )}{" "}
              scored {result.total === 1 ? "job" : "jobs"} · {sortLabel}
            </>
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-foreground tabular-nums">{result.total}</span>
              {hasActiveFilters && totalMatches !== result.total && (
                <>
                  {" "}
                  of <span className="tabular-nums">{totalMatches}</span>
                </>
              )}{" "}
              scored {result.total === 1 ? "job" : "jobs"} · {sortLabel}
            </>
          )}
        </p>
      )}
      <JobsFoundTable rows={rows} />
      <Suspense fallback={<PaginationFallback />}>
        <JobsPagination
          basePath={basePath}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          rangeStart={result.rangeStart}
          rangeEnd={result.rangeEnd}
          scrollAnchor={scrollAnchor}
        />
      </Suspense>
    </>
  );
}
