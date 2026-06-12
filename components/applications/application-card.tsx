"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, MapPin, Wifi, ExternalLink } from "lucide-react";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { Badge } from "@/components/ui/badge";
import { cn, formatSalary } from "@/lib/utils";
import type { KanbanApplication } from "./types";
import { KANBAN_COLUMNS, statusToColumn } from "@/lib/applications/kanban-config";
import type { ApplicationStatus } from "@/types";

interface ApplicationCardProps {
  application: KanbanApplication;
  onOpen: (app: KanbanApplication) => void;
  isOverlay?: boolean;
}

function statusAccent(status: ApplicationStatus) {
  const col = KANBAN_COLUMNS.find((c) => c.status === statusToColumn(status));
  return col ?? KANBAN_COLUMNS[0];
}

export function ApplicationCard({ application, onOpen, isOverlay }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { application },
  });

  const accent = statusAccent(application.status);
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      className={cn(
        "group touch-none",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "rotate-2 scale-105"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm",
          "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
          accent.border,
          isOverlay && "shadow-xl ring-2 ring-primary/20"
        )}
      >
        {/* Status color strip */}
        <div className={cn("absolute inset-y-0 left-0 w-1", accent.dot)} />

        <div className="p-3.5 pl-4">
          <div className="flex items-start gap-3">
            <CompanyLogo company={application.job.company} size="sm" />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  className="text-left min-w-0"
                  onClick={() => onOpen(application)}
                >
                  <p className="text-sm font-medium tracking-tight truncate group-hover:text-primary transition-colors">
                    {application.job.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {application.job.company}
                  </p>
                </button>
                <button
                  type="button"
                  className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground p-0.5 -mr-1"
                  {...listeners}
                  {...attributes}
                  aria-label="Drag to move"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {application.matchScore != null && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 tabular-nums">
                    {Math.round(application.matchScore)}%
                  </Badge>
                )}
                {application.job.isRemote ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Wifi className="h-3 w-3" /> Remote
                  </span>
                ) : application.job.location ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground truncate max-w-[120px]">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {application.job.location}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-[10px] text-muted-foreground/80 tabular-nums">
                {formatSalary(
                  application.job.salaryMin,
                  application.job.salaryMax,
                  application.job.salaryCurrency ?? "USD"
                )}
              </p>

              {application.notes && (
                <p className="mt-2 text-[10px] text-muted-foreground line-clamp-2 border-t border-border/40 pt-2">
                  {application.notes}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <a
              href={application.job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View posting <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
