"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAgentTask } from "@/app/actions/agent";
import type { ManagerTask } from "@/lib/ai/agents/manager-agent";
import { CV_REQUIRED_MESSAGE, CV_SETTINGS_PATH } from "@/lib/profile/cv-constants";
import { toast } from "sonner";

interface RunAgentButtonProps {
  task?: ManagerTask;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  hasCv?: boolean;
}

interface PipelineResults {
  search?: {
    found?: number;
    saved?: number;
    duplicates?: number;
    byProvider?: Record<string, number>;
  };
  scoring?: {
    scored?: number;
    failed?: number;
    attempted?: number;
    highMatches?: number;
    remaining?: number;
  };
}

function formatPipelineMessage(results: PipelineResults): string {
  const found = results.search?.found ?? 0;
  const saved = results.search?.saved ?? 0;
  const scored = results.scoring?.scored ?? 0;
  const failed = results.scoring?.failed ?? 0;
  const attempted = results.scoring?.attempted ?? 0;

  if (found === 0 && scored === 0) {
    return "No jobs found. Check your profile skills and OpenRouter API key, then try again.";
  }

  if (saved === 0 && scored === 0 && found > 0) {
    return `Found ${found} jobs (already in database). Scoring ${attempted}… none completed${failed ? ` (${failed} AI errors)` : ""}.`;
  }

  const parts = [
    `Found ${found} jobs`,
    saved > 0 ? `${saved} new saved` : null,
    scored > 0 ? `${scored} scored` : null,
    failed > 0 ? `${failed} scoring errors` : null,
  ].filter(Boolean);

  const sources = results.search?.byProvider;
  if (sources && Object.keys(sources).length > 0) {
    const sourceSummary = Object.entries(sources)
      .map(([name, count]) => `${name}: ${count}`)
      .join(", ");
    return `${parts.join(" · ")} (${sourceSummary})`;
  }

  return parts.join(" · ");
}

export function RunAgentButton({
  task = "full_pipeline",
  label = "Run Job Hunter",
  variant = "default",
  hasCv = true,
}: RunAgentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRun() {
    if (!hasCv) {
      toast.error(CV_REQUIRED_MESSAGE);
      router.push(CV_SETTINGS_PATH);
      return;
    }

    setLoading(true);
    try {
      const result = await runAgentTask(task);
      if (result.success && result.data) {
        const results = (result.data as { results?: PipelineResults }).results ?? {};
        const message = formatPipelineMessage(results);

        if ((results.scoring?.scored ?? 0) > 0 || (results.search?.saved ?? 0) > 0) {
          toast.success(message);
        } else {
          toast.warning(message);
        }
      } else {
        toast.error(result.error ?? "Agent run failed");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleRun} disabled={loading || !hasCv} variant={variant}>
      <Bot className="h-4 w-4" />
      {loading ? "Hunting..." : !hasCv ? "Upload CV to hunt" : label}
    </Button>
  );
}
