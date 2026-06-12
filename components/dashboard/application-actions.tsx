"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  updateApplicationStatus,
  generateApplicationMaterials,
} from "@/app/actions/applications";
import type { ApplicationStatus } from "@/types";
import { toast } from "sonner";

interface ApplicationActionsProps {
  applicationId: string;
  jobId: string;
  status: ApplicationStatus;
}

export function ApplicationActions({ applicationId, jobId, status }: ApplicationActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateApplicationMaterials(jobId);
      if (result.success) {
        toast.success("Resume, cover letter, and outreach generated!");
      } else {
        toast.error(result.error ?? "Generation failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(newStatus: ApplicationStatus) {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate materials"}
      </Button>
      {status === "saved" && (
        <Button size="sm" onClick={() => handleStatus("applied")}>
          Mark applied
        </Button>
      )}
      {status === "applied" && (
        <Button size="sm" variant="secondary" onClick={() => handleStatus("recruiter_contacted")}>
          Recruiter contacted
        </Button>
      )}
    </div>
  );
}
