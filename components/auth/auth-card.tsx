import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl",
        "ring-1 ring-white/5 dark:ring-white/[0.03]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface AuthCardHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function AuthCardHeader({ title, description, className }: AuthCardHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  );
}
