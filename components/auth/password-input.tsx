"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  error?: string;
  valid?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, valid, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-background/50 px-3 py-1 pr-10",
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
          ref={ref}
          disabled={disabled}
          aria-invalid={!!error}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className={cn(
            "absolute right-0 top-0 flex h-10 w-10 items-center justify-center",
            "text-muted-foreground transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
          )}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          disabled={disabled}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
