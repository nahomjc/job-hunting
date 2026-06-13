"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Building2, Globe2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { scanNoWebsiteLeads, type NoWebsiteLead } from "@/app/actions/business-leads";
import { InvestigateJobButton } from "@/components/jobs/investigate-job-button";
import type { Job } from "@/lib/db/schema";
import { toast } from "sonner";

function toJobStub(lead: NoWebsiteLead): Job {
  return {
    id: lead.jobId,
    company: lead.company,
    title: lead.title,
    url: lead.jobUrl,
    location: lead.location,
  } as Job;
}

export function HuntBusinessLeadsPanel() {
  const [leads, setLeads] = useState<NoWebsiteLead[]>([]);
  const [scanned, setScanned] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleScan() {
    startTransition(async () => {
      try {
        const results = await scanNoWebsiteLeads();
        setLeads(results);
        setScanned(true);
        if (results.length === 0) {
          toast.message("No missing-website leads in your latest jobs", {
            description: "All probed companies had a reachable site, or run a hunt first.",
          });
        } else {
          toast.success(`Found ${results.length} companies without a working website`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Scan failed");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card/50 overflow-hidden">
      <div className="border-b border-border/60 bg-muted/10 px-5 py-4 space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Local business leads</h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              After a job hunt, scan employers for missing or broken websites — ideal targets if you
              offer web design, marketing, or branding. Click <strong>Investigate</strong> to draft a
              pitch letter using your services from Settings.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={handleScan}
            className="shrink-0"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Globe2 className="h-4 w-4" />
                Scan for no-website companies
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        {!scanned ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm text-muted-foreground">
              Run a country hunt first, then scan to find local employers hiring without a proper
              web presence.
            </p>
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No companies with missing websites in your recent hunt results.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {leads.map((lead) => (
              <li
                key={lead.jobId}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{lead.company}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.title}</p>
                  {lead.location && (
                    <p className="text-xs text-muted-foreground/80 mt-0.5">{lead.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {lead.websiteStatus}
                  </Badge>
                  <InvestigateJobButton job={toJobStub(lead)} variant="outline" />
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/leads">Leads</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
