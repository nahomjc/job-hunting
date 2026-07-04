"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STATS_PERIOD,
  STATS_PERIOD_OPTIONS,
  type StatsPeriod,
} from "@/lib/analytics/stats-period";

interface DashboardStatsFilterProps {
  basePath?: string;
}

export function DashboardStatsFilter({ basePath = "/dashboard" }: DashboardStatsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current =
    (searchParams.get("period") as StatsPeriod) || DEFAULT_STATS_PERIOD;

  function setPeriod(period: StatsPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (period === DEFAULT_STATS_PERIOD) params.delete("period");
    else params.set("period", period);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarRange className="h-4 w-4 shrink-0" />
        <span>Stats period</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATS_PERIOD_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={current === value ? "default" : "outline"}
            className={cn("h-8 rounded-full px-3 text-xs")}
            onClick={() => setPeriod(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
