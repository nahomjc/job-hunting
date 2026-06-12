import { Calendar } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InterviewCard } from "@/components/interviews/interview-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
          <div className="space-y-4">
            <EmptyState
              icon={Calendar}
              title="No interviews scheduled"
              description="Move applications to the Interview column on your tracker — they'll appear here with AI prep notes."
            />
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard/applications">Open Application Tracker</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {interviews.map(({ interview, job, application }) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                job={job}
                application={application}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
