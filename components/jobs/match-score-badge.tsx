import { cn, formatPercent } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number;
  className?: string;
}

function scoreTone(score: number) {
  if (score >= 80) return "text-success border-success/30 bg-success/10";
  if (score >= 60) return "text-warning border-warning/30 bg-warning/10 dark:text-[hsl(38,92%,60%)]";
  return "text-muted-foreground border-border bg-muted/50";
}

export function MatchScoreBadge({ score, className }: MatchScoreBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
        scoreTone(score),
        className
      )}
    >
      <div className="relative h-1.5 w-12 overflow-hidden rounded-full bg-current/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-current transition-all duration-500"
          style={{ width: `${Math.min(100, score)}%`, opacity: 0.7 }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums">{formatPercent(score)}</span>
    </div>
  );
}
