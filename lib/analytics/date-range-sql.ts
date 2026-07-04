import { gte, lte, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import type { StatsDateRange } from "@/lib/analytics/stats-period";

/** Append timestamp bounds for a real table column. */
export function withDateRange(
  conditions: SQL[],
  column: AnyColumn,
  range: StatsDateRange
): SQL[] {
  if (range.from) {
    conditions.push(gte(column, range.from));
  }
  if (range.to) {
    conditions.push(lte(column, range.to));
  }
  return conditions;
}

/** Append timestamp bounds for a SQL expression (e.g. COALESCE). */
export function withSqlDateRange(
  conditions: SQL[],
  expression: SQL,
  range: StatsDateRange
): SQL[] {
  if (range.from) {
    conditions.push(sql`${expression} >= ${range.from.toISOString()}::timestamptz`);
  }
  if (range.to) {
    conditions.push(sql`${expression} <= ${range.to.toISOString()}::timestamptz`);
  }
  return conditions;
}
