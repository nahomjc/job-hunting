import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  label?: string;
}

export function TrendIndicator({ value, label }: TrendIndicatorProps) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
        positive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      )}
    >
      {positive ? "+" : ""}
      {value.toFixed(1)}%
      {label && <span className="font-sans text-[10px] opacity-70">{label}</span>}
    </span>
  );
}
