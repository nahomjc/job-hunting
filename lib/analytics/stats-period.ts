export type StatsPeriod =
  | "this_month"
  | "last_month"
  | "last_7_days"
  | "last_30_days"
  | "all_time";

export const DEFAULT_STATS_PERIOD: StatsPeriod = "all_time";

const VALID_PERIODS = new Set<string>([
  "this_month",
  "last_month",
  "last_7_days",
  "last_30_days",
  "all_time",
]);

export interface StatsDateRange {
  from: Date | null;
  to: Date | null;
}

export const STATS_PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: "all_time", label: "All time" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
];

export function parseStatsPeriod(value: string | null | undefined): StatsPeriod {
  if (value && VALID_PERIODS.has(value)) return value as StatsPeriod;
  return DEFAULT_STATS_PERIOD;
}

export function getStatsPeriodLabel(period: StatsPeriod): string {
  return STATS_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "All time";
}

export function hasActiveDateRange(range?: StatsDateRange | null): boolean {
  return Boolean(range?.from ?? range?.to);
}

export function getStatsDateRange(period: StatsPeriod, now = new Date()): StatsDateRange {
  if (period === "all_time") {
    return { from: null, to: null };
  }

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  switch (period) {
    case "last_7_days": {
      const from = new Date(now);
      from.setUTCDate(from.getUTCDate() - 7);
      from.setUTCHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case "last_30_days": {
      const from = new Date(now);
      from.setUTCDate(from.getUTCDate() - 30);
      from.setUTCHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case "last_month": {
      const from = new Date(Date.UTC(year, month - 1, 1));
      const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      return { from, to };
    }
    case "this_month":
    default: {
      const from = new Date(Date.UTC(year, month, 1));
      return { from, to: now };
    }
  }
}
