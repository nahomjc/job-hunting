import type { ApplicationStatus } from "@/types";

export interface KanbanColumnConfig {
  id: string;
  label: string;
  status: ApplicationStatus;
  accent: string;
  border: string;
  bg: string;
  dot: string;
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "saved",
    label: "Saved",
    status: "saved",
    accent: "text-slate-400",
    border: "border-slate-500/20",
    bg: "bg-slate-500/5",
    dot: "bg-slate-400",
  },
  {
    id: "applied",
    label: "Applied",
    status: "applied",
    accent: "text-blue-400",
    border: "border-blue-500/25",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400",
  },
  {
    id: "recruiter_contacted",
    label: "Recruiter Replied",
    status: "recruiter_contacted",
    accent: "text-amber-400",
    border: "border-amber-500/25",
    bg: "bg-amber-500/5",
    dot: "bg-amber-400",
  },
  {
    id: "interview_scheduled",
    label: "Interview",
    status: "interview_scheduled",
    accent: "text-violet-400",
    border: "border-violet-500/25",
    bg: "bg-violet-500/5",
    dot: "bg-violet-400",
  },
  {
    id: "offer_received",
    label: "Offer",
    status: "offer_received",
    accent: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/5",
    dot: "bg-emerald-400",
  },
  {
    id: "rejected",
    label: "Rejected",
    status: "rejected",
    accent: "text-red-400",
    border: "border-red-500/25",
    bg: "bg-red-500/5",
    dot: "bg-red-400",
  },
];

/** Map DB status to kanban column (discovered → saved) */
export function statusToColumn(status: ApplicationStatus): ApplicationStatus {
  if (status === "discovered") return "saved";
  return status;
}

export function columnLabel(status: ApplicationStatus): string {
  const col = KANBAN_COLUMNS.find((c) => c.status === statusToColumn(status));
  return col?.label ?? status.replace(/_/g, " ");
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  discovered: "Discovered",
  saved: "Saved",
  applied: "Applied",
  recruiter_contacted: "Recruiter Replied",
  interview_scheduled: "Interview",
  offer_received: "Offer",
  rejected: "Rejected",
};
