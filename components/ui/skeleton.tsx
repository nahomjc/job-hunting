import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva("rounded-md animate-shimmer", {
  variants: {
    variant: {
      default: "bg-muted",
      text: "h-4 w-full bg-muted rounded",
      circle: "rounded-full bg-muted",
    },
  },
  defaultVariants: { variant: "default" },
});

function Skeleton({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>) {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} />;
}

export { Skeleton };
