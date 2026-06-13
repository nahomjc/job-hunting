"use client";

import { CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CvReview } from "@/lib/services/cv-parser-service";
import { gradeLetter, gradeToneClasses } from "@/lib/cv/cv-review";

interface CvReviewPanelProps {
  review: CvReview;
  className?: string;
}

const PRIORITY_VARIANT: Record<
  CvReview["improvements"][number]["priority"],
  "destructive" | "secondary" | "outline"
> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function CvReviewPanel({ review, className }: CvReviewPanelProps) {
  const letter = gradeLetter(review.overallGrade);
  const toneClasses = gradeToneClasses(review.overallGrade);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/50 overflow-hidden",
        className
      )}
    >
      <div className="border-b border-border/60 bg-muted/10 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              CV professional grade
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {review.readinessSummary ||
                "How ready your CV is for job applications — ATS-friendly, clarity, and impact."}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 shrink-0",
              toneClasses
            )}
          >
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums leading-none">
                {review.overallGrade}
              </p>
              <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1">/ 100</p>
            </div>
            <div className="h-10 w-px bg-current/20" />
            <div className="text-center min-w-[3rem]">
              <p className="text-2xl font-bold leading-none">{letter}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1">
                {review.gradeLabel || "Grade"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {review.strengths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              What&apos;s working
            </p>
            <ul className="space-y-1.5">
              {review.strengths.map((strength) => (
                <li
                  key={strength}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {review.improvements.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              How to improve before you apply
            </p>
            <ul className="space-y-3">
              {review.improvements.map((hint, i) => (
                <li
                  key={`${hint.area}-${i}`}
                  className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{hint.area}</span>
                    <Badge variant={PRIORITY_VARIANT[hint.priority]} className="text-[10px] capitalize">
                      {hint.priority}
                    </Badge>
                  </div>
                  {hint.issue && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">Issue: </span>
                      {hint.issue}
                    </p>
                  )}
                  {hint.suggestion && (
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium text-primary">Tip: </span>
                      {hint.suggestion}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
