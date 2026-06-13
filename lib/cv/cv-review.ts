import type { CvReview } from "@/lib/services/cv-parser-service";

export function gradeLetter(grade: number): string {
  if (grade >= 97) return "A+";
  if (grade >= 93) return "A";
  if (grade >= 90) return "A-";
  if (grade >= 87) return "B+";
  if (grade >= 83) return "B";
  if (grade >= 80) return "B-";
  if (grade >= 77) return "C+";
  if (grade >= 73) return "C";
  if (grade >= 70) return "C-";
  if (grade >= 67) return "D+";
  if (grade >= 63) return "D";
  if (grade >= 60) return "D-";
  return "F";
}

export function gradeTone(grade: number): "excellent" | "good" | "fair" | "poor" {
  if (grade >= 85) return "excellent";
  if (grade >= 70) return "good";
  if (grade >= 55) return "fair";
  return "poor";
}

const TONE_CLASSES = {
  excellent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  good: "text-primary bg-primary/10 border-primary/25",
  fair: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
  poor: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25",
} as const;

export function gradeToneClasses(grade: number): string {
  return TONE_CLASSES[gradeTone(grade)];
}

export function parseStoredCvReview(
  preferences: Record<string, unknown> | null | undefined
): CvReview | null {
  const raw = preferences?.cvReview;
  if (!raw || typeof raw !== "object") return null;

  const review = raw as Record<string, unknown>;
  const overallGrade = Number(review.overallGrade);
  if (!Number.isFinite(overallGrade)) return null;

  const improvements = Array.isArray(review.improvements)
    ? review.improvements
        .filter((item): item is Record<string, unknown> => item && typeof item === "object")
        .map((item) => ({
          area: String(item.area ?? "General"),
          issue: String(item.issue ?? ""),
          suggestion: String(item.suggestion ?? ""),
          priority: (["high", "medium", "low"].includes(String(item.priority))
            ? item.priority
            : "medium") as "high" | "medium" | "low",
        }))
        .filter((item) => item.issue || item.suggestion)
    : [];

  return {
    overallGrade: Math.min(100, Math.max(0, Math.round(overallGrade))),
    gradeLabel: String(review.gradeLabel ?? ""),
    readinessSummary: String(review.readinessSummary ?? ""),
    strengths: Array.isArray(review.strengths)
      ? review.strengths.map(String).filter(Boolean)
      : [],
    improvements,
  };
}
