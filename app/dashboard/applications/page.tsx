import { ClipboardList } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationActions } from "@/components/dashboard/application-actions";
import { getAuthUser } from "@/lib/supabase/server";
import { applicationRepository } from "@/lib/repositories/application-repository";
import { formatSalary } from "@/lib/utils";

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  discovered: "outline",
  saved: "secondary",
  applied: "default",
  recruiter_contacted: "warning",
  interview_scheduled: "success",
  offer_received: "success",
  rejected: "destructive",
};

export default async function ApplicationsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let applications: Awaited<ReturnType<typeof applicationRepository.findForUser>> = [];
  try {
    applications = await applicationRepository.findForUser(user.id);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header title="Applications" description="Track every application through the pipeline" />
      <div className="flex-1 p-4 md:p-8">
        {applications.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications yet"
            description="Save jobs from your matches and generate application materials to get started."
          />
        ) : (
          <div className="space-y-4">
            {applications.map(({ application, job, match }) => (
              <Card key={application.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {match && (
                      <Badge variant="success">{Math.round(match.score)}% match</Badge>
                    )}
                    <Badge variant={statusColors[application.status] ?? "outline"} className="capitalize">
                      {application.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {formatSalary(job.salaryMin, job.salaryMax)} · {job.isRemote ? "Remote" : job.location}
                  </div>
                  <ApplicationActions applicationId={application.id} jobId={job.id} status={application.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
