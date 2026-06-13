"use client";

import { useState } from "react";
import { Search, Copy, Loader2, Globe, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { investigateCompany } from "@/app/actions/investigations";
import { SERVICE_OPTIONS, type ServiceOffered } from "@/lib/jobs/hunt-preferences";
import type { CompanyInvestigation, Job } from "@/lib/db/schema";
import { toast } from "sonner";

interface CompanyInvestigationPanelProps {
  job: Job;
  trigger?: React.ReactNode;
}

function severityVariant(severity: string) {
  if (severity === "high") return "destructive" as const;
  if (severity === "medium") return "warning" as const;
  return "secondary" as const;
}

function websiteLabel(status: string) {
  if (status === "found") return "Website found";
  if (status === "unreachable") return "Website unreachable";
  return "No website detected";
}

export function CompanyInvestigationPanel({ job, trigger }: CompanyInvestigationPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [investigation, setInvestigation] = useState<CompanyInvestigation | null>(null);
  const [pitchService, setPitchService] = useState<ServiceOffered>("website");
  const [tab, setTab] = useState<"intel" | "pitch">("intel");

  async function runInvestigation(withPitch = false) {
    setLoading(true);
    try {
      const result = await investigateCompany(
        job.id,
        withPitch ? pitchService : undefined
      );
      setInvestigation(result);
      if (withPitch) setTab("pitch");
      toast.success(withPitch ? "Pitch letter generated" : "Investigation complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Investigation failed");
    } finally {
      setLoading(false);
    }
  }

  function copyPitch() {
    if (!investigation?.pitchLetter) return;
    navigator.clipboard.writeText(investigation.pitchLetter);
    toast.success("Copied to clipboard");
  }

  const gaps = (investigation?.gaps ?? []) as {
    type: string;
    severity: string;
    evidence: string;
  }[];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
            Investigate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investigate {job.company}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {job.title} — check company gaps and optionally draft a service pitch.
        </p>

        {!investigation && (
          <Button onClick={() => runInvestigation(false)} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Investigating…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Run investigation
              </>
            )}
          </Button>
        )}

        {investigation && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={tab === "intel" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("intel")}
              >
                Intel
              </Button>
              <Button
                variant={tab === "pitch" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("pitch")}
              >
                Pitch letter
              </Button>
            </div>

            {tab === "intel" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{websiteLabel(investigation.websiteStatus)}</span>
                  {investigation.websiteUrl && (
                    <a
                      href={investigation.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs truncate"
                    >
                      {investigation.websiteUrl}
                    </a>
                  )}
                </div>

                {investigation.intelSummary && (
                  <p className="text-sm leading-relaxed rounded-lg bg-muted/30 p-3">
                    {investigation.intelSummary}
                  </p>
                )}

                {gaps.length > 0 ? (
                  <ul className="space-y-2">
                    {gaps.map((gap) => (
                      <li
                        key={`${gap.type}-${gap.evidence}`}
                        className="rounded-lg border border-border/60 p-3 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={severityVariant(gap.severity)} className="capitalize">
                            {gap.type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {gap.severity}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{gap.evidence}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    No major gaps detected from available data.
                  </p>
                )}
              </div>
            )}

            {tab === "pitch" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPitchService(opt.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        pitchService === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => runInvestigation(true)}
                  disabled={loading}
                  variant="secondary"
                  className="w-full"
                >
                  {loading ? "Generating…" : `Generate ${pitchService.replace(/_/g, " ")} pitch`}
                </Button>
                {investigation.pitchLetter && (
                  <div className="space-y-2">
                    <pre className="text-xs whitespace-pre-wrap rounded-lg bg-muted/40 p-3 max-h-48 overflow-y-auto">
                      {investigation.pitchLetter}
                    </pre>
                    <Button variant="outline" size="sm" onClick={copyPitch}>
                      <Copy className="h-4 w-4" />
                      Copy letter
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => runInvestigation(false)}
              disabled={loading}
            >
              Re-run investigation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
