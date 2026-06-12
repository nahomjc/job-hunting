"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { KanbanColumnConfig } from "@/lib/applications/kanban-config";
import type { KanbanApplication } from "./types";
import { ApplicationCard } from "./application-card";

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  applications: KanbanApplication[];
  onOpenApplication: (app: KanbanApplication) => void;
}

export function KanbanColumn({ column, applications, onOpenApplication }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <div className="flex w-[280px] shrink-0 flex-col md:w-[300px]">
      {/* Column header */}
      <div
        className={cn(
          "mb-3 flex items-center justify-between rounded-lg border px-3 py-2",
          column.border,
          column.bg
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", column.dot)} />
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", column.accent)}>
            {column.label}
          </h3>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {applications.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-xl border border-dashed p-2 transition-all duration-200",
          isOver
            ? "border-primary/50 bg-primary/5 shadow-[inset_0_0_20px_hsl(var(--primary)/0.08)]"
            : "border-border/40 bg-muted/10"
        )}
      >
        {applications.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-[11px] text-muted-foreground/50 text-center px-4">
              Drop applications here
            </p>
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onOpen={onOpenApplication}
            />
          ))
        )}
      </div>
    </div>
  );
}
