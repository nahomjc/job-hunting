"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  updateApplicationStatus,
  updateApplicationNotes,
  getApplicationTimeline,
} from "@/app/actions/applications";
import { KANBAN_COLUMNS, statusToColumn } from "@/lib/applications/kanban-config";
import type { ApplicationStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { ApplicationCard } from "./application-card";
import { ApplicationDetailDialog } from "./application-detail-dialog";
import type { KanbanApplication, TimelineEvent } from "./types";

interface KanbanBoardProps {
  initialApplications: KanbanApplication[];
}

export function KanbanBoard({ initialApplications }: KanbanBoardProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<KanbanApplication | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeApplication = activeId
    ? applications.find((a) => a.id === activeId)
    : null;

  const grouped = KANBAN_COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = applications.filter(
        (a) => statusToColumn(a.status) === col.status
      );
      return acc;
    },
    {} as Record<ApplicationStatus, KanbanApplication[]>
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = String(active.id);
    const newStatus = over.id as ApplicationStatus;

    const app = applications.find((a) => a.id === applicationId);
    if (!app || statusToColumn(app.status) === newStatus) return;

    const previous = [...applications];
    setApplications((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );

    startTransition(async () => {
      try {
        await updateApplicationStatus(applicationId, newStatus);
        toast.success(`Moved to ${KANBAN_COLUMNS.find((c) => c.status === newStatus)?.label}`);
        if (selected?.id === applicationId) {
          setSelected((s) => (s ? { ...s, status: newStatus } : s));
          loadTimeline(applicationId);
        }
      } catch (err) {
        setApplications(previous);
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  }

  const loadTimeline = useCallback(async (applicationId: string) => {
    setLoadingTimeline(true);
    try {
      const events = await getApplicationTimeline(applicationId);
      setTimeline(events);
    } catch {
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  }, []);

  function handleOpenApplication(app: KanbanApplication) {
    setSelected(app);
    loadTimeline(app.id);
  }

  async function handleSaveNotes(notes: string) {
    if (!selected) return;
    try {
      await updateApplicationNotes(selected.id, notes);
      setApplications((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, notes } : a))
      );
      setSelected((s) => (s ? { ...s, notes } : s));
      loadTimeline(selected.id);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save notes");
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
          {KANBAN_COLUMNS.map((column) => (
            <div key={column.id} className="snap-start">
              <KanbanColumn
                column={column}
                applications={grouped[column.status] ?? []}
                onOpenApplication={handleOpenApplication}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {activeApplication ? (
            <ApplicationCard
              application={activeApplication}
              onOpen={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ApplicationDetailDialog
        application={selected}
        timeline={timeline}
        loadingTimeline={loadingTimeline}
        onClose={() => setSelected(null)}
        onSaveNotes={handleSaveNotes}
        onStatusChange={async (status) => {
          if (!selected) return;
          await updateApplicationStatus(selected.id, status);
          setApplications((prev) =>
            prev.map((a) => (a.id === selected.id ? { ...a, status } : a))
          );
          setSelected((s) => (s ? { ...s, status } : s));
          loadTimeline(selected.id);
        }}
      />
    </>
  );
}
