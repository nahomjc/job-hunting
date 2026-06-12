import { cn } from "@/lib/utils";

type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "caption"
  | "label"
  | "mono";

const variantStyles: Record<TypographyVariant, string> = {
  display: "text-display font-semibold tracking-tight",
  h1: "text-3xl font-semibold tracking-tight",
  h2: "text-heading font-semibold",
  h3: "text-subheading font-medium",
  body: "text-body text-foreground",
  caption: "text-caption",
  label: "text-label",
  mono: "text-mono text-sm",
};

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Typography({
  variant = "body",
  as: Tag = "p",
  className,
  ...props
}: TypographyProps) {
  const Component = Tag as React.ElementType;
  return <Component className={cn(variantStyles[variant], className)} {...props} />;
}
