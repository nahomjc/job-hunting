import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendIndicator } from "./trend-indicator";

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  trendLabel,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "admin-metric-card rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-surface))] p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--admin-muted))]">
          {label}
        </p>
        {Icon && (
          <Icon className="h-4 w-4 shrink-0 text-[hsl(var(--admin-muted))] opacity-60" />
        )}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-[hsl(var(--admin-foreground))] tabular-nums">
        {value}
      </p>
      {(sublabel || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && <TrendIndicator value={trend} label={trendLabel} />}
          {sublabel && (
            <span className="text-[12px] text-[hsl(var(--admin-muted))]">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
