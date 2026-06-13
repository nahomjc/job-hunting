"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Building2, Globe2, Loader2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  scanLocalBusinessLeads,
  type BusinessLeadResult,
} from "@/app/actions/business-leads";
import { InvestigateJobButton } from "@/components/jobs/investigate-job-button";
import type { Job } from "@/lib/db/schema";
import { toast } from "sonner";

interface HuntBusinessLeadsPanelProps {
  countryCode?: string;
  countryLabel?: string;
}

function toJobStub(lead: BusinessLeadResult): Job {
  return {
    id: lead.jobId,
    company: lead.company,
    title: lead.title,
    url: lead.jobUrl,
    location: lead.location,
    description: lead.analysisNote,
  } as Job;
}

export function HuntBusinessLeadsPanel({
  countryCode,
  countryLabel = "your hunt country",
}: HuntBusinessLeadsPanelProps) {
  const [leads, setLeads] = useState<BusinessLeadResult[]>([]);
  const [scanned, setScanned] = useState(false);
  const [pending, startTransition] = useTransition();

  const canScan = Boolean(countryCode);

  function handleScan() {
    startTransition(async () => {
      try {
        const results = await scanLocalBusinessLeads();
        setLeads(results);
        setScanned(true);
        if (results.length === 0) {
          toast.message(`No website-less businesses found in ${countryLabel}`, {
            description: "Try another area or run again — we scan hotels, restaurants, and shops on maps.",
          });
        } else {
          toast.success(
            `Found ${results.length} local businesses in ${countryLabel} that need a website`
          );
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
              100% <strong>free</strong> — uses <strong>OpenStreetMap</strong> (no Google API key).
              Finds hotels, restaurants, and shops in <strong>{countryLabel}</strong>, then checks
              which ones have no working website. Returns up to <strong>5 leads</strong> per scan.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !canScan}
            onClick={handleScan}
            className="shrink-0"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning maps…
              </>
            ) : (
              <>
                <Globe2 className="h-4 w-4" />
                Find 5 local leads
              </>
            )}
          </Button>
        </div>
        {!canScan && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Set a hunt country above (or in Settings → Local hunt) to scan businesses in your target
            region.
          </p>
        )}
      </div>

      <div className="px-5 py-4">
        {!scanned ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm text-muted-foreground">
              {canScan
                ? `Search local businesses in ${countryLabel} via free OpenStreetMap data — no API key or job hunt required.`
                : "Choose a hunt country first, then scan for local business leads."}
            </p>
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No missing-website businesses found in {countryLabel} this time. Try again later or
            pick a different country.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {leads.map((lead) => (
              <li
                key={lead.jobId}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm truncate">{lead.company}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      OpenStreetMap
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{lead.category}</p>
                  {lead.location && (
                    <p className="text-xs text-muted-foreground/80 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{lead.location}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {lead.analysisNote}
                  </p>
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
