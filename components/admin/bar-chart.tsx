import { cn } from "@/lib/utils";

interface BarChartProps {
  data: { label: string; value: number; secondary?: number }[];
  valueFormatter?: (n: number) => string;
  secondaryFormatter?: (n: number) => string;
  className?: string;
}

export function BarChart({
  data,
  valueFormatter = (n) => n.toLocaleString(),
  secondaryFormatter,
  className,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-2", className)}>
      {data.map((item) => (
        <div key={item.label} className="group">
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="text-[hsl(var(--admin-muted))]">{item.label}</span>
            <span className="font-mono tabular-nums text-[hsl(var(--admin-foreground))]">
              {valueFormatter(item.value)}
              {item.secondary !== undefined && secondaryFormatter && (
                <span className="ml-2 text-[hsl(var(--admin-muted))]">
                  {secondaryFormatter(item.secondary)}
                </span>
              )}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--admin-border))]">
            <div
              className="h-full rounded-full bg-[hsl(var(--admin-accent))] transition-all duration-500"
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SparklineProps {
  data: number[];
  className?: string;
}

export function Sparkline({ data, className }: SparklineProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 120;
  const height = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("text-[hsl(var(--admin-accent))]", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
