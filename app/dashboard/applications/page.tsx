import { ClipboardList } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { getAuthUser } from "@/lib/supabase/server";
import { applicationRepository } from "@/lib/repositories/application-repository";
import type { KanbanApplication } from "@/components/applications/types";
import { statusToColumn } from "@/lib/applications/kanban-config";

function serializeApplications(
  rows: Awaited<ReturnType<typeof applicationRepository.findForUser>>
): KanbanApplication[] {
  return rows.map(({ application, job, match }) => ({
      id: application.id,
      status: application.status === "discovered" ? "saved" : application.status,
      notes: application.notes,
      appliedAt: application.appliedAt?.toISOString() ?? null,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        isRemote: job.isRemote,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
      },
      matchScore: match?.score ?? null,
    }));
}

export default async function ApplicationsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let kanbanApps: KanbanApplication[] = [];
  try {
    const rows = await applicationRepository.findForUser(user.id);
    kanbanApps = serializeApplications(rows);
  } catch {
    // DB not configured
  }

  const pipelineCount = kanbanApps.length;

  return (
    <>
      <Header
        title="Application Tracker"
        description="Drag cards across your pipeline — from saved to offer"
      />
      <div className="flex-1 p-4 md:p-8">
        {pipelineCount === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications yet"
            description="Save jobs from Jobs Found to add them to your Saved column, then drag through your pipeline."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {pipelineCount} application{pipelineCount === 1 ? "" : "s"} in pipeline
            </p>
            <KanbanBoard initialApplications={kanbanApps} />
          </>
        )}
      </div>
    </>
  );
}
