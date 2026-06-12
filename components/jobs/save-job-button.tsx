"use client";

import { useState, useTransition } from "react";
import { Bookmark, Loader2, Check } from "lucide-react";
import { saveJob } from "@/app/actions/applications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SaveJobButtonProps {
  jobId: string;
  saved?: boolean;
  className?: string;
}

export function SaveJobButton({ jobId, saved = false, className }: SaveJobButtonProps) {
  const [isSaved, setIsSaved] = useState(saved);
  const [pending, startTransition] = useTransition();

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved || pending) return;

    startTransition(async () => {
      try {
        await saveJob(jobId);
        setIsSaved(true);
        toast.success("Job saved to your pipeline");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save job");
      }
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || isSaved}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
            "border border-transparent transition-all duration-200",
            "hover:bg-primary/10 hover:border-primary/20 hover:scale-105",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none",
            isSaved && "text-primary bg-primary/10 border-primary/20",
            className
          )}
          aria-label={isSaved ? "Saved" : "Save job"}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isSaved ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{isSaved ? "Saved" : "Save job"}</TooltipContent>
    </Tooltip>
  );
}
