"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthSubmitButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
}

export function AuthSubmitButton({
  loading,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="premium"
      className={cn("w-full h-10", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText ?? "Please wait..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
