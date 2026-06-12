"use client";

import { Suspense } from "react";
import { JobsSearchBar } from "@/components/jobs/jobs-search-bar";
import { JobsAdvancedFilters } from "@/components/jobs/jobs-advanced-filters";
import { Skeleton } from "@/components/ui/skeleton";

export function JobsFoundToolbar() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <JobsSearchBar />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-8 w-48" />}>
        <JobsAdvancedFilters />
      </Suspense>
    </div>
  );
}
