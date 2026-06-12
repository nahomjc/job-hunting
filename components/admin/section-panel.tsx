import { cn } from "@/lib/utils";

interface SectionPanelProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionPanel({
  title,
  description,
  action,
  children,
  className,
}: SectionPanelProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-surface))]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[hsl(var(--admin-border))] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--admin-foreground))]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[12px] text-[hsl(var(--admin-muted))]">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
