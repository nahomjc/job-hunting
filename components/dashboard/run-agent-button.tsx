"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAgentTask } from "@/app/actions/agent";
import { toast } from "sonner";

export function RunAgentButton() {
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    setLoading(true);
    try {
      const result = await runAgentTask("full_pipeline");
      if (result.success) {
        toast.success("Job hunt complete! Check your matches.");
      } else {
        toast.error(result.error ?? "Agent run failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleRun} disabled={loading}>
      <Bot className="h-4 w-4" />
      {loading ? "Hunting..." : "Run Job Hunter"}
    </Button>
  );
}
