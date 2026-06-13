"use client";

import { Suspense } from "react";
import { JobsSearchBar } from "@/components/jobs/jobs-search-bar";
import { JobsAdvancedFilters } from "@/components/jobs/jobs-advanced-filters";
import { JobsActiveFilters } from "@/components/jobs/jobs-active-filters";
import { JobsSortBar } from "@/components/jobs/jobs-sort-bar";
import { Skeleton } from "@/components/ui/skeleton";

interface JobsFilterToolbarProps {
  basePath: string;
  variant?: "jobs" | "hunt";
}

export function JobsFilterToolbar({ basePath, variant = "jobs" }: JobsFilterToolbarProps) {
  const isHunt = variant === "hunt";

  return (
    <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-4 shadow-sm">
      <Suspense fallback={<Skeleton className="h-8 w-48" />}>
        <JobsSortBar
          basePath={basePath}
          defaultSort={isHunt ? "date" : "score"}
          scrollAnchor={isHunt ? "hunt-results" : "jobs-results"}
        />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <JobsSearchBar
          basePath={basePath}
          placeholder={
            isHunt
              ? "Search hunt results by title, company, location…"
              : "Search jobs, companies, locations…"
          }
        />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-8 w-full" />}>
        <JobsAdvancedFilters basePath={basePath} variant={variant} />
      </Suspense>
      <Suspense fallback={null}>
        <JobsActiveFilters basePath={basePath} variant={variant} />
      </Suspense>
    </div>
  );
}

/** @deprecated Use JobsFilterToolbar */
export function JobsFoundToolbar() {
  return <JobsFilterToolbar basePath="/dashboard/jobs" variant="jobs" />;
}
