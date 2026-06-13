import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { JobsFoundTable, type JobTableRow } from "@/components/jobs/jobs-found-table";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import type { JobMatchFilters } from "@/types";

interface JobsResultsSectionProps {
  userId: string;
  filters: JobMatchFilters;
  totalMatches: number;
  emptyDescription?: string;
  showFilteredCount?: boolean;
}

export async function JobsResultsSection({
  userId,
  filters,
  totalMatches,
  emptyDescription,
  showFilteredCount = true,
}: JobsResultsSectionProps) {
  const matches = await jobMatchRepository.findForUser(userId, filters);
  const rows: JobTableRow[] = matches.map(({ job, match, application }) => ({
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

  if (rows.length === 0) {
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

  return (
    <>
      {showFilteredCount && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing{" "}
          <span className="font-medium text-foreground tabular-nums">{rows.length}</span>
          {hasActiveFilters && totalMatches !== rows.length && (
            <>
              {" "}
              of <span className="tabular-nums">{totalMatches}</span>
            </>
          )}{" "}
          scored {rows.length === 1 ? "job" : "jobs"}
        </p>
      )}
      <JobsFoundTable rows={rows} />
    </>
  );
}
