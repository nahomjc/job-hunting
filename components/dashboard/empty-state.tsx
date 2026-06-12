import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-12 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 mb-5">
        <Icon className="h-7 w-7 text-muted-foreground/70" />
      </div>
      <h3 className="text-subheading">{title}</h3>
      <p className="text-caption mt-2 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" variant="premium" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
