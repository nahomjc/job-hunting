"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInterviewPrep } from "@/app/actions/interviews";
import type { Application, Interview, Job } from "@/lib/db/schema";
import { toast } from "sonner";

interface InterviewCardProps {
  interview: Interview;
  job: Job;
  application: Application;
}

export function InterviewCard({ interview, job, application }: InterviewCardProps) {
  const [pending, startTransition] = useTransition();
  const [prepNotes, setPrepNotes] = useState(interview.prepNotes);
  const [questions, setQuestions] = useState(interview.likelyQuestions ?? []);

  const hasPrep = Boolean(prepNotes?.trim());

  function handleGenerate() {
    startTransition(async () => {
      try {
        await generateInterviewPrep(application.id, interview.stage ?? "technical");
        toast.success("Interview prep generated!");
        window.location.reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to generate prep");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
          <Badge variant="outline" className="capitalize shrink-0">
            {interview.stage.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {interview.scheduledAt && (
          <p className="text-sm">
            Scheduled: {new Date(interview.scheduledAt).toLocaleString()}
          </p>
        )}

        {hasPrep ? (
          <>
            <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">{prepNotes}</div>
            {questions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Likely questions</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {questions.map((q) => (
                    <li key={q}>• {q}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Regenerate prep
            </Button>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              This application is in your Interview pipeline. Generate AI prep notes and likely
              questions for this role.
            </p>
            <Button type="button" onClick={handleGenerate} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI prep
                </>
              )}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary" className="capitalize">
            Application: {application.status.replace(/_/g, " ")}
          </Badge>
          {job.url && (
            <Button variant="ghost" size="sm" asChild className="h-7 px-2">
              <Link href={job.url} target="_blank" rel="noopener noreferrer">
                View job
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="h-7 px-2">
            <Link href="/dashboard/applications">Open tracker</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
