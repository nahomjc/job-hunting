import { cn } from "@/lib/utils";

const variants = {
  default: "border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] text-[hsl(var(--admin-muted))]",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  danger: "border-red-500/20 bg-red-500/10 text-red-400",
  accent: "border-[hsl(var(--admin-accent)/0.25)] bg-[hsl(var(--admin-accent)/0.1)] text-[hsl(var(--admin-accent))]",
  running: "border-blue-500/20 bg-blue-500/10 text-blue-400",
} as const;

interface StatusPillProps {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export function StatusPill({ children, variant = "default", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function agentStatusVariant(
  status: string
): keyof typeof variants {
  switch (status) {
    case "running":
      return "running";
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "default";
  }
}

export function planVariant(plan: string | null): keyof typeof variants {
  switch (plan) {
    case "team":
      return "accent";
    case "pro":
      return "success";
    default:
      return "default";
  }
}
