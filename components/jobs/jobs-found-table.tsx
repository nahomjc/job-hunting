"use client";

import Link from "next/link";
import { ExternalLink, MapPin, Wifi, Building2 } from "lucide-react";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { MatchScoreBadge } from "@/components/jobs/match-score-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateFound, formatSalary } from "@/lib/utils";
import {
  EXPERIENCE_LABELS,
  inferExperienceLevel,
} from "@/lib/jobs/job-metadata";
import type { Application, Job, JobMatch } from "@/lib/db/schema";

export interface JobTableRow {
  job: Job;
  match: JobMatch;
  application: Application | null;
}

interface JobsFoundTableProps {
  rows: JobTableRow[];
}

function RemoteBadge({ job }: { job: Job }) {
  const loc = (job.location ?? "").toLowerCase();
  const isHybrid = loc.includes("hybrid");

  if (isHybrid) {
    return (
      <Badge variant="outline" className="gap-1 font-normal">
        <Building2 className="h-3 w-3" />
        Hybrid
      </Badge>
    );
  }

  if (job.isRemote) {
    return (
      <Badge variant="success" className="gap-1 font-normal">
        <Wifi className="h-3 w-3" />
        Remote
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      <Building2 className="h-3 w-3" />
      On-site
    </Badge>
  );
}

export function JobsFoundTable({ rows }: JobsFoundTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-4 py-3 text-left text-label !normal-case !tracking-normal w-[52px]" />
              <th className="px-4 py-3 text-left text-label !normal-case !tracking-normal">
                Job title
              </th>
              <th className="px-4 py-3 text-left text-label !normal-case !tracking-normal hidden lg:table-cell">
                Salary
              </th>
              <th className="px-4 py-3 text-left text-label !normal-case !tracking-normal">
                Remote
              </th>
              <th className="px-4 py-3 text-left text-label !normal-case !tracking-normal hidden md:table-cell">
                Location
              </th>
              <th className="px-4 py-3 text-left text-label !normal-case !tracking-normal">
                Match
              </th>
              <th className="px-4 py-3 text-left text-label !normal-case !tracking-normal hidden sm:table-cell">
                Found
              </th>
              <th className="px-4 py-3 text-right text-label !normal-case !tracking-normal w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ job, match, application }, index) => {
              const experience = inferExperienceLevel(job);
              const isSaved =
                !!application && application.status !== "discovered";

              return (
                <tr
                  key={match.id}
                  className={cn(
                    "group border-b border-border/40 last:border-0",
                    "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "hover:bg-primary/[0.03] hover:shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-4 py-3.5">
                    <CompanyLogo company={job.company} size="sm" />
                  </td>

                  <td className="px-4 py-3.5 max-w-[280px]">
                    <div className="min-w-0">
                      <Link
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium tracking-tight truncate block group-hover:text-primary transition-colors duration-150"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {job.company}
                        {experience !== "unknown" && (
                          <span className="text-muted-foreground/60">
                            {" · "}
                            {EXPERIENCE_LABELS[experience]}
                          </span>
                        )}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 hidden lg:table-cell whitespace-nowrap">
                    <span className="text-muted-foreground tabular-nums">
                      {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency ?? "USD")}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <RemoteBadge job={job} />
                  </td>

                  <td className="px-4 py-3.5 hidden md:table-cell max-w-[160px]">
                    {job.location ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        <span className="truncate">{job.location}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <MatchScoreBadge score={match.score} />
                  </td>

                  <td className="px-4 py-3.5 hidden sm:table-cell whitespace-nowrap">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateFound(job.createdAt)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <SaveJobButton jobId={job.id} saved={isSaved} />
                      <Link
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                          "text-muted-foreground transition-all duration-200",
                          "hover:bg-accent hover:text-foreground hover:scale-105"
                        )}
                        aria-label="Open job posting"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
