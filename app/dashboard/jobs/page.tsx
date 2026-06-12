import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { JobMatchCard } from "@/components/dashboard/job-match-card";
import { JobFilters } from "@/components/dashboard/job-filters";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RunAgentButton } from "@/components/dashboard/run-agent-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthUser } from "@/lib/supabase/server";
import { jobMatchRepository } from "@/lib/repositories/job-match-repository";
import { jobRepository } from "@/lib/repositories/job-repository";

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
  totalJobs,
  totalMatches,
}: {
  userId: string;
  filters: {
    minScore?: number;
    minSalary?: number;
    remote?: boolean;
    location?: string;
  };
  totalJobs: number;
  totalMatches: number;
}) {
  const matches = await jobMatchRepository.findForUser(userId, filters);

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No job matches yet"
        description={
          totalMatches === 0 && totalJobs === 0
            ? "Click “Search & score jobs” to fetch listings from RemoteOK and AI-score them against your profile. Make sure your profile has skills saved and OPENROUTER_API_KEY is set."
            : totalMatches === 0 && totalJobs > 0
              ? `${totalJobs} jobs in database but none scored yet. Run “Search & score jobs” — scoring uses AI (~20 jobs per run).`
              : "No matches match your filters. Clear filters or lower the minimum score."
        }
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

  let totalJobs = 0;
  let totalMatches = 0;
  try {
    [totalJobs, totalMatches] = await Promise.all([
      jobRepository.count(),
      jobMatchRepository.findForUser(user.id).then((m) => m.length),
    ]);
  } catch {
    // DB not configured
  }

  return (
    <>
      <Header title="Job Matches" description="AI-scored opportunities ranked for you" />
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <p className="text-sm text-muted-foreground">
            {totalMatches > 0
              ? `${totalMatches} scored matches · ${totalJobs} jobs in database`
              : "Search job boards, then AI scores each role against your profile."}
          </p>
          <RunAgentButton label="Search & score jobs" />
        </div>
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
          <JobList
            userId={user.id}
            filters={filters}
            totalJobs={totalJobs}
            totalMatches={totalMatches}
          />
        </Suspense>
      </div>
    </>
  );
}
