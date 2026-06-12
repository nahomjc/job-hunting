import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const surfaceVariants = cva("", {
  variants: {
    variant: {
      default: "bg-background",
      card: "bg-card border border-border rounded-xl",
      glass: "surface-glass border border-border/50 rounded-xl",
      muted: "bg-muted/50 rounded-xl",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "none",
  },
});

interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export function Surface({ className, variant, padding, ...props }: SurfaceProps) {
  return <div className={cn(surfaceVariants({ variant, padding }), className)} {...props} />;
}
