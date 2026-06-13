"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyInvestigationPanel } from "@/components/jobs/company-investigation-panel";
import type { Job } from "@/lib/db/schema";

interface InvestigateJobButtonProps {
  job: Job;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "secondary";
}

export function InvestigateJobButton({
  job,
  size = "sm",
  variant = "outline",
}: InvestigateJobButtonProps) {
  return (
    <CompanyInvestigationPanel
      job={job}
      trigger={
        <Button variant={variant} size={size} type="button">
          <Search className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Investigate</span>
        </Button>
      }
    />
  );
}
