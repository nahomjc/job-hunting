import { Calendar } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUser } from "@/lib/supabase/server";
import { interviewRepository } from "@/lib/repositories/interview-repository";

export default async function InterviewsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let interviews: Awaited<ReturnType<typeof interviewRepository.findForUser>> = [];
  try {
    interviews = await interviewRepository.findForUser(user.id);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header title="Interviews" description="Upcoming interviews and prep notes" />
      <div className="flex-1 p-4 md:p-8">
        {interviews.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No interviews scheduled"
            description="When you schedule interviews, AI-generated prep notes and likely questions will appear here."
          />
        ) : (
          <div className="space-y-4">
            {interviews.map(({ interview, job, application }) => (
              <Card key={interview.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {interview.stage.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interview.scheduledAt && (
                    <p className="text-sm">
                      Scheduled: {new Date(interview.scheduledAt).toLocaleString()}
                    </p>
                  )}
                  {interview.prepNotes && (
                    <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                      {interview.prepNotes}
                    </div>
                  )}
                  {interview.likelyQuestions && interview.likelyQuestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Likely questions:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {interview.likelyQuestions.map((q, i) => (
                          <li key={i}>• {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Badge variant={application.status === "offer_received" ? "success" : "secondary"} className="capitalize">
                    Application: {application.status.replace(/_/g, " ")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
