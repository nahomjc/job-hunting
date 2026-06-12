"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ArrowRight,
  StickyNote,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { MatchScoreBadge } from "@/components/jobs/match-score-badge";
import { cn, formatSalary, formatDateFound } from "@/lib/utils";
import {
  KANBAN_COLUMNS,
  STATUS_LABELS,
  statusToColumn,
} from "@/lib/applications/kanban-config";
import type { ApplicationStatus } from "@/types";
import type { KanbanApplication, TimelineEvent } from "./types";

interface ApplicationDetailDialogProps {
  application: KanbanApplication | null;
  timeline: TimelineEvent[];
  loadingTimeline: boolean;
  onClose: () => void;
  onSaveNotes: (notes: string) => Promise<void>;
  onStatusChange: (status: ApplicationStatus) => Promise<void>;
}

function TimelineIcon({ eventType }: { eventType: string }) {
  if (eventType === "status_change") {
    return <ArrowRight className="h-3.5 w-3.5 text-primary" />;
  }
  if (eventType === "note_updated") {
    return <StickyNote className="h-3.5 w-3.5 text-amber-400" />;
  }
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function ApplicationDetailDialog({
  application,
  timeline,
  loadingTimeline,
  onClose,
  onSaveNotes,
  onStatusChange,
}: ApplicationDetailDialogProps) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(application?.notes ?? "");
  }, [application]);

  if (!application) return null;

  const column = KANBAN_COLUMNS.find(
    (c) => c.status === statusToColumn(application.status)
  );

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveNotes(notes);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!application} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <CompanyLogo company={application.job.company} />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-left leading-snug">
                {application.job.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {application.job.company}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            {column && (
              <Badge
                variant="outline"
                className={cn("gap-1.5", column.accent, column.border)}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", column.dot)} />
                {column.label}
              </Badge>
            )}
            {application.matchScore != null && (
              <MatchScoreBadge score={application.matchScore} />
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {formatSalary(
              application.job.salaryMin,
              application.job.salaryMax,
              application.job.salaryCurrency ?? "USD"
            )}
            {application.job.isRemote ? " · Remote" : application.job.location ? ` · ${application.job.location}` : ""}
          </p>

          <Button variant="outline" size="sm" asChild>
            <a href={application.job.url} target="_blank" rel="noopener noreferrer">
              View job posting
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>

          {/* Quick status move */}
          <div>
            <p className="text-label mb-2">Move to</p>
            <div className="flex flex-wrap gap-1.5">
              {KANBAN_COLUMNS.map((col) => (
                <Button
                  key={col.id}
                  type="button"
                  size="sm"
                  variant={statusToColumn(application.status) === col.status ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => onStatusChange(col.status)}
                >
                  {col.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <p className="text-label mb-2 flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Notes
            </p>
            <Textarea
              placeholder="Add interview prep, recruiter names, follow-up dates…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none bg-background/50"
            />
            <Button
              size="sm"
              className="mt-2"
              variant="secondary"
              onClick={handleSave}
              disabled={saving || notes === (application.notes ?? "")}
            >
              {saving ? "Saving…" : "Save notes"}
            </Button>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <p className="text-label mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </p>

            {loadingTimeline ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No history yet — move this card to start tracking
              </p>
            ) : (
              <div className="relative space-y-0 pl-1">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />
                {timeline.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                      <TimelineIcon eventType={event.eventType} />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm leading-snug">{event.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                        {formatDateFound(event.createdAt)}
                        {event.toStatus && (
                          <span className="ml-2 opacity-60">
                            · {STATUS_LABELS[event.toStatus]}
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
