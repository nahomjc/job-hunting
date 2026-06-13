import type { Notification } from "@/lib/db/schema";
import {
  Bell,
  Calendar,
  Mail,
  Target,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export function notificationIcon(type: Notification["type"]): LucideIcon {
  switch (type) {
    case "high_match_job":
      return Target;
    case "recruiter_response":
      return Mail;
    case "interview_scheduled":
      return Calendar;
    case "weekly_report":
      return BarChart3;
    default:
      return Bell;
  }
}

export function notificationAccent(type: Notification["type"]): string {
  switch (type) {
    case "high_match_job":
      return "text-emerald-500 bg-emerald-500/10";
    case "recruiter_response":
      return "text-blue-500 bg-blue-500/10";
    case "interview_scheduled":
      return "text-violet-500 bg-violet-500/10";
    case "weekly_report":
      return "text-amber-500 bg-amber-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

export function formatNotificationTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
