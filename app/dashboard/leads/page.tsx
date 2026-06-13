import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/supabase/server";
import { companyInvestigationRepository } from "@/lib/repositories/company-investigation-repository";
import { Search, Globe, ExternalLink } from "lucide-react";

export default async function BusinessLeadsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let rows: Awaited<ReturnType<typeof companyInvestigationRepository.findForUser>> = [];
  try {
    rows = await companyInvestigationRepository.findForUser(user.id);
  } catch {
    // DB not configured or migration pending
  }

  return (
    <>
      <Header
        title="Business Leads"
        description="Companies you investigated — gaps found and pitch letters drafted"
      />
      <div className="flex-1 space-y-6 p-4 md:p-8">
        {rows.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={Search}
              title="No investigations yet"
              description="Open Jobs Found or Overview, click Investigate on any company to analyze gaps and draft pitch letters."
            />
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard/jobs">Browse jobs</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map(({ investigation, job }) => {
              const gaps = (investigation.gaps ?? []) as {
                type: string;
                severity: string;
              }[];

              return (
                <div
                  key={investigation.id}
                  className="rounded-xl border border-border/80 bg-card/50 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{investigation.company}</h3>
                      <p className="text-sm text-muted-foreground">{job.title}</p>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0">
                      {investigation.websiteStatus}
                    </Badge>
                  </div>

                  {investigation.intelSummary && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {investigation.intelSummary}
                    </p>
                  )}

                  {gaps.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {gaps.slice(0, 4).map((g) => (
                        <Badge key={g.type} variant="secondary" className="text-xs capitalize">
                          {g.type.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {investigation.pitchService && (
                    <p className="text-xs text-muted-foreground">
                      Pitch: {investigation.pitchService.replace(/_/g, " ")}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={job.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Job posting
                      </Link>
                    </Button>
                    {investigation.websiteUrl && (
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={investigation.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
