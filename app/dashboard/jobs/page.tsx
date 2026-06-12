import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { JobMatchCard } from "@/components/dashboard/job-match-card";
import { JobFilters } from "@/components/dashboard/job-filters";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";

interface JobsPageProps {
  searchParams: Promise<{
    minScore?: string;
    minSalary?: string;
    remote?: string;
    location?: string;
  }>;
}

async function JobList({
  userId,
  filters,
}: {
  userId: string;
  filters: {
    minScore?: number;
    minSalary?: number;
    remote?: boolean;
    location?: string;
  };
}) {
  const matches = await jobMatchRepository.findForUser(userId, filters);

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No job matches found"
        description="Run the job hunter agent or adjust your filters to see more results."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {matches.map(({ job, match, application }) => (
        <JobMatchCard key={match.id} job={job} match={match} application={application} />
      ))}
    </div>
  );
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await getAuthUser();
  if (!user) return null;

  const params = await searchParams;
  const filters = {
    minScore: params.minScore ? Number(params.minScore) : undefined,
    minSalary: params.minSalary ? Number(params.minSalary) : undefined,
    remote: params.remote === "true" ? true : undefined,
    location: params.location,
  };

  return (
    <>
      <Header title="Job Matches" description="AI-scored opportunities ranked for you" />
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <JobFilters />
        </Suspense>
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          }
        >
          <JobList userId={user.id} filters={filters} />
        </Suspense>
      </div>
    </>
  );
}
