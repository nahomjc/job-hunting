import type { ApplicationStatus } from "@/types";

export interface KanbanApplication {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    url: string;
    location: string | null;
    isRemote: boolean | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
  };
  matchScore: number | null;
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  message: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null;
  createdAt: string;
}
