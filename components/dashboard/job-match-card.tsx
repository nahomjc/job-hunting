import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatSalary } from "@/lib/utils";
import { MapPin, Building2, Wifi } from "lucide-react";
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-3.5 w-3.5" />
              {job.company}
            </p>
          </div>
          <Badge variant={scoreVariant(match.score)}>{Math.round(match.score)}% match</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={match.score} className="h-1.5" />
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {match.reasons.slice(0, 3).map((reason, i) => (
              <li key={i}>• {reason}</li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between pt-2">
          {application && (
            <Badge variant="outline" className="capitalize">
              {application.status.replace(/_/g, " ")}
            </Badge>
          )}
          <Link
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline ml-auto"
          >
            View posting →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
