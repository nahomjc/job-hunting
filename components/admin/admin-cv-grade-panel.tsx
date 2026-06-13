import { gradeLetter, gradeToneClasses } from "@/lib/cv/cv-review";
import type { CvReview } from "@/lib/services/cv-parser-service";

interface AdminCvGradePanelProps {
  review: CvReview;
  reviewedAt?: string | null;
}

export function AdminCvGradePanel({ review, reviewedAt }: AdminCvGradePanelProps) {
  const letter = gradeLetter(review.overallGrade);
  const toneClasses = gradeToneClasses(review.overallGrade);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div
          className={`flex items-center gap-4 rounded-xl border px-5 py-4 shrink-0 ${toneClasses}`}
        >
          <div>
            <p className="text-4xl font-bold tabular-nums leading-none">
              {review.overallGrade}
            </p>
            <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1">/ 100</p>
          </div>
          <div className="h-12 w-px bg-current/20" />
          <div>
            <p className="text-3xl font-bold leading-none">{letter}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1">
              {review.gradeLabel}
            </p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-[hsl(var(--admin-foreground))] leading-relaxed">
            {review.readinessSummary}
          </p>
          {reviewedAt && (
            <p className="text-[11px] text-[hsl(var(--admin-muted))] mt-2">
              Last reviewed {new Date(reviewedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {review.strengths.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--admin-muted))] mb-2">
            Strengths
          </p>
          <ul className="space-y-1 text-sm text-[hsl(var(--admin-muted))]">
            {review.strengths.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>
      )}

      {review.improvements.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--admin-muted))] mb-2">
            Top improvement hints
          </p>
          <ul className="space-y-2">
            {review.improvements.slice(0, 4).map((hint, i) => (
              <li
                key={`${hint.area}-${i}`}
                className="rounded-lg border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] px-3 py-2 text-xs"
              >
                <span className="font-medium text-[hsl(var(--admin-foreground))]">
                  {hint.area}
                </span>
                <span className="text-[hsl(var(--admin-muted))]"> — {hint.suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
