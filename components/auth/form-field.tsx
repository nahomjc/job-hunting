"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  valid?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  valid,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {(error || hint || valid) && (
        <div className="flex items-start gap-1.5 min-h-[1.25rem]">
          {error ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-snug">{error}</p>
            </>
          ) : valid ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
              <p className="text-xs text-success leading-snug">{hint ?? "Looks good"}</p>
            </>
          ) : hint ? (
            <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface ValidatedInputProps extends React.ComponentProps<"input"> {
  error?: string;
  valid?: boolean;
}

export function ValidatedInput({ error, valid, className, ...props }: ValidatedInputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-lg border bg-background/50 px-3 py-1",
        "text-sm shadow-xs transition-all duration-150",
        "placeholder:text-muted-foreground/60",
        "hover:border-foreground/15",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-destructive/60 focus-visible:ring-destructive/30 focus-visible:border-destructive"
          : valid
            ? "border-success/40 focus-visible:ring-success/20 focus-visible:border-success/60"
            : "border-input focus-visible:ring-ring/40 focus-visible:border-primary/50",
        className
      )}
      aria-invalid={!!error}
      {...props}
    />
  );
}
