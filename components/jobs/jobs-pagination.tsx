"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearPageParam } from "@/lib/jobs/pagination";

interface JobsPaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  scrollAnchor?: string;
  className?: string;
}

export function JobsPagination({
  basePath,
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  scrollAnchor,
  className,
}: JobsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) clearPageParam(params);
    else params.set("page", String(nextPage));
    const query = params.toString();
    const hash = scrollAnchor ? `#${scrollAnchor}` : "";
    router.push(query ? `${basePath}?${query}${hash}` : `${basePath}${hash}`);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border/60",
        className
      )}
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing{" "}
        <span className="font-medium text-foreground">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span> jobs
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums px-1 min-w-[4.5rem] text-center">
          Page {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
