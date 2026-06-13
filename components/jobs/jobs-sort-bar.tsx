"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownWideNarrow, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobSortBy } from "@/types";

interface JobsSortBarProps {
  basePath: string;
  defaultSort?: JobSortBy;
  scrollAnchor?: string;
}

const SORT_OPTIONS: { value: JobSortBy; label: string; icon: typeof ArrowDownWideNarrow }[] = [
  { value: "date", label: "Newest first", icon: ArrowDownWideNarrow },
  { value: "score", label: "Best match", icon: Star },
];

export function JobsSortBar({ basePath, defaultSort = "date", scrollAnchor }: JobsSortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("sort") as JobSortBy) || defaultSort;

  function setSort(sort: JobSortBy) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === defaultSort) params.delete("sort");
    else params.set("sort", sort);
    const query = params.toString();
    const hash = scrollAnchor ? `#${scrollAnchor}` : "";
    router.push(query ? `${basePath}?${query}${hash}` : `${basePath}${hash}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Sort by</span>
      {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant={current === value ? "default" : "outline"}
          className={cn("h-8 rounded-full px-3 text-xs gap-1.5")}
          onClick={() => setSort(value)}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}
