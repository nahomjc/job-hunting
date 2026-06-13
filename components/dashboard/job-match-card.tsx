import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatSalary } from "@/lib/utils";
import { MapPin, Building2, Wifi, ArrowUpRight } from "lucide-react";
import { InvestigateJobButton } from "@/components/jobs/investigate-job-button";
import type { Job, JobMatch, Application } from "@/lib/db/schema";

interface JobMatchCardProps {
  job: Job;
  match: JobMatch;
  application?: Application | null;
}

function scoreVariant(score: number) {
  if (score >= 80) return "success" as const;
  if (score >= 60) return "warning" as const;
  return "secondary" as const;
}

export function JobMatchCard({ job, match, application }: JobMatchCardProps) {
  return (
    <Card variant="interactive" className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base truncate group-hover:text-primary transition-colors duration-150">
              {job.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.company}</span>
            </p>
          </div>
          <Badge variant={scoreVariant(match.score)} className="shrink-0 tabular-nums">
            {Math.round(match.score)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={match.score} className="h-1" />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {job.isRemote && (
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Remote
            </span>
          )}
          <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency ?? "USD")}</span>
        </div>
        {match.reasons && match.reasons.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-1 border-t border-border/60 pt-3">
            {match.reasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary/60 shrink-0">·</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-2">
            {application && (
              <Badge variant="outline" className="capitalize">
                {application.status.replace(/_/g, " ")}
              </Badge>
            )}
            <InvestigateJobButton job={job} />
          </div>
          <Link
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary ml-auto opacity-80 hover:opacity-100 transition-opacity duration-150"
          >
            View posting
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
