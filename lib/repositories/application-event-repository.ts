import { eq, and, desc } from "drizzle-orm";
import { requireDb, applicationEvents } from "@/lib/db";
import type { ApplicationStatus } from "@/types";
import { STATUS_LABELS } from "@/lib/applications/kanban-config";

export const applicationEventRepository = {
  async create(data: {
    applicationId: string;
    userId: string;
    eventType: string;
    message: string;
    fromStatus?: ApplicationStatus | null;
    toStatus?: ApplicationStatus | null;
    metadata?: Record<string, unknown>;
  }) {
    const db = requireDb();
    const [event] = await db.insert(applicationEvents).values(data).returning();
    return event;
  },

  async findForApplication(applicationId: string, userId: string) {
    const db = requireDb();
    return db
      .select()
      .from(applicationEvents)
      .where(
        and(
          eq(applicationEvents.applicationId, applicationId),
          eq(applicationEvents.userId, userId)
        )
      )
      .orderBy(desc(applicationEvents.createdAt));
  },

  async logStatusChange(
    applicationId: string,
    userId: string,
    fromStatus: ApplicationStatus | null,
    toStatus: ApplicationStatus
  ) {
    const fromLabel = fromStatus ? STATUS_LABELS[fromStatus] : "New";
    const toLabel = STATUS_LABELS[toStatus];
    return this.create({
      applicationId,
      userId,
      eventType: "status_change",
      fromStatus: fromStatus ?? undefined,
      toStatus,
      message: `Moved from ${fromLabel} to ${toLabel}`,
    });
  },

  async logNoteUpdate(applicationId: string, userId: string) {
    return this.create({
      applicationId,
      userId,
      eventType: "note_updated",
      message: "Notes updated",
    });
  },

  async logCreated(applicationId: string, userId: string, status: ApplicationStatus) {
    return this.create({
      applicationId,
      userId,
      eventType: "created",
      toStatus: status,
      message: `Application saved — ${STATUS_LABELS[status]}`,
    });
  },
};
