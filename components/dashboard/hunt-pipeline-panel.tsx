"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Circle,
  Filter,
  Loader2,
  Radar,
  Sparkles,
  Square,
  Target,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/agents/activity-display";
import { PIPELINE_CANCEL_MESSAGE } from "@/lib/agents/cancellation";
import { clearPageParam } from "@/lib/jobs/pagination";
import type { LastHuntSummary } from "@/lib/hunt/last-run";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type PipelineVariant = "hunt" | "global";

export interface JobSearchPipelinePanelProps {
  variant: PipelineVariant;
  providerCount: number;
  lastRun: LastHuntSummary | null;
  basePath: string;
  resultsAnchorId: string;
  countryLabel?: string;
  modeLabel?: string;
  /** URL tab param to switch to when pipeline completes (e.g. jobs page tabs). */
  onCompleteTab?: string;
}

type StepState = "pending" | "active" | "complete" | "error";

interface PipelineStep {
  id: string;
  label: string;
  icon: typeof Radar;
  state: StepState;
  detail: string;
}

interface ActivityAgent {
  type: string;
  status: string;
  progress: number;
  latestMessage: string;
}

interface PipelineResults {
  search?: { found?: number; saved?: number; byProvider?: Record<string, number> };
  scoring?: { scored?: number; failed?: number; highMatches?: number };
}

interface ActivityResponse {
  agents: ActivityAgent[];
  pipeline?: {
    running: boolean;
    manager?: {
      id: string;
      status: string;
      error: string | null;
      results: PipelineResults | null;
    } | null;
  };
}

const POLL_MS = 1200;

const COPY = {
  hunt: {
    title: "Country hunt pipeline",
    subtitle: "Live progress across scan → filter → AI scoring",
    runningStatus: "Hunting…",
    runningButton: "Hunting in progress…",
    startButton: "Start country hunt",
    againButton: "Run again",
    prepareLabel: "Prepare hunt",
    filterLabel: "Filter by region",
    previousRun: "Previous hunt",
    failToast: "Hunt failed",
    failRun: "Failed to run hunt",
    emptyWarning:
      "Hunt finished but no new jobs were found. Try another country or broader mode.",
    completePrefix: "Hunt complete",
    stopButton: "Stop hunt",
    stoppingToast: "Stopping hunt…",
    stoppedToast: "Hunt stopped",
    alreadyRunningToast: "Hunt already in progress — showing live status",
  },
  global: {
    title: "Job search pipeline",
    subtitle: "Live progress across scan → preferences → AI scoring",
    runningStatus: "Searching…",
    runningButton: "Search in progress…",
    startButton: "Search & score jobs",
    againButton: "Search again",
    prepareLabel: "Prepare search",
    filterLabel: "Apply preferences",
    previousRun: "Previous search",
    failToast: "Search failed",
    failRun: "Failed to run search",
    emptyWarning:
      "Search finished but no new jobs were found. Check your profile skills and try again.",
    completePrefix: "Search complete",
    stopButton: "Stop search",
    stoppingToast: "Stopping search…",
    stoppedToast: "Search stopped",
    alreadyRunningToast: "Search already in progress — showing live status",
  },
} as const;

function stepIcon(state: StepState) {
  if (state === "complete") return CheckCircle2;
  if (state === "error") return XCircle;
  if (state === "active") return Loader2;
  return Circle;
}

function buildSteps(
  variant: PipelineVariant,
  phase: "idle" | "running" | "complete" | "error",
  hunter: ActivityAgent | null,
  matcher: ActivityAgent | null,
  countryLabel: string,
  modeLabel: string,
  results: PipelineResults | null,
  providerCount: number
): PipelineStep[] {
  const copy = COPY[variant];
  const hunterRunning = hunter?.status === "running";
  const matcherRunning = matcher?.status === "running";
  const hunterDone = hunter?.status === "completed" || phase === "complete";
  const matcherDone = matcher?.status === "completed" || phase === "complete";

  const prepareState: StepState =
    phase === "error"
      ? "error"
      : phase === "idle"
        ? "pending"
        : hunterRunning && (hunter?.progress ?? 0) < 12
          ? "active"
          : hunterDone || matcherRunning || matcherDone
            ? "complete"
            : phase === "running"
              ? "active"
              : "pending";

  const scanState: StepState =
    phase === "error"
      ? "error"
      : hunterRunning && (hunter?.progress ?? 0) >= 12
        ? "active"
        : hunterDone
          ? "complete"
          : "pending";

  const filterState: StepState =
    phase === "error"
      ? hunterDone
        ? "complete"
        : "error"
      : hunterRunning && (hunter?.progress ?? 0) >= 45
        ? "active"
        : hunterDone || matcherRunning || matcherDone
          ? "complete"
          : "pending";

  const scoreState: StepState =
    phase === "error"
      ? "error"
      : matcherRunning
        ? "active"
        : matcherDone
          ? "complete"
          : "pending";

  const found = results?.search?.found ?? 0;
  const saved = results?.search?.saved ?? 0;
  const scored = results?.scoring?.scored ?? 0;
  const high = results?.scoring?.highMatches ?? 0;
  const sourceCount = results?.search?.byProvider
    ? Object.keys(results.search.byProvider).length
    : providerCount;

  const prepareIdle =
    variant === "hunt"
      ? `${countryLabel} · ${modeLabel}`
      : "Skills, salary & remote preferences from your profile";

  const filterIdle =
    variant === "hunt"
      ? "Remote in country or on-site local"
      : "Remote preference, locations & role fit";

  const filterActive =
    variant === "hunt"
      ? hunter?.latestMessage?.includes("Targeting")
        ? hunter.latestMessage
        : `Applying ${modeLabel.toLowerCase()} filter for ${countryLabel}`
      : (hunter?.latestMessage ?? "Matching jobs to your profile preferences…");

  const filterDone =
    variant === "hunt"
      ? `Roles matching ${countryLabel} and hunt mode`
      : "Listings aligned with your profile settings";

  return [
    {
      id: "prepare",
      label: copy.prepareLabel,
      icon: Sparkles,
      state: prepareState,
      detail:
        prepareState === "active"
          ? "Loading profile & search settings…"
          : prepareIdle,
    },
    {
      id: "scan",
      label: "Scan job boards",
      icon: Radar,
      state: scanState,
      detail:
        scanState === "active"
          ? (hunter?.latestMessage ?? `Querying ${providerCount}+ sources…`)
          : hunterDone
            ? `Found ${found} listings across ${sourceCount} sources${saved > 0 ? ` · ${saved} new` : ""}`
            : `${providerCount}+ public job boards`,
    },
    {
      id: "filter",
      label: copy.filterLabel,
      icon: Filter,
      state: filterState,
      detail:
        filterState === "active"
          ? filterActive
          : hunterDone
            ? filterDone
            : filterIdle,
    },
    {
      id: "score",
      label: "AI match scoring",
      icon: Target,
      state: scoreState,
      detail:
        scoreState === "active"
          ? (matcher?.latestMessage ?? "Scoring jobs against your profile…")
          : matcherDone
            ? `${scored} scored${high > 0 ? ` · ${high} high matches` : ""}`
            : "Match Analyzer ranks fit 0–100",
    },
  ];
}

function overallProgress(
  steps: PipelineStep[],
  hunter: ActivityAgent | null,
  matcher: ActivityAgent | null
) {
  if (matcher?.status === "completed") return 100;
  if (matcher?.status === "running") return Math.min(98, 72 + (matcher.progress ?? 0) * 0.28);
  if (hunter?.status === "completed") return 68;
  if (hunter?.status === "running") return Math.min(68, 8 + (hunter.progress ?? 0) * 0.6);
  const completed = steps.filter((s) => s.state === "complete").length;
  return Math.round((completed / steps.length) * 100);
}

export function JobSearchPipelinePanel({
  variant,
  providerCount,
  lastRun,
  basePath,
  resultsAnchorId,
  countryLabel = "Any country",
  modeLabel = "Any",
  onCompleteTab,
}: JobSearchPipelinePanelProps) {
  const copy = COPY[variant];
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [hunter, setHunter] = useState<ActivityAgent | null>(null);
  const [matcher, setMatcher] = useState<ActivityAgent | null>(null);
  const [results, setResults] = useState<PipelineResults | null>(null);
  const [stopping, setStopping] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasWatchingRef = useRef(false);
  const completionHandledForRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const finishPipeline = useCallback(
    (data: ActivityResponse) => {
      const manager = data.pipeline?.manager;
      if (!manager) return;
      if (completionHandledForRef.current === manager.id) return;
      completionHandledForRef.current = manager.id;

      if (manager.error === PIPELINE_CANCEL_MESSAGE) {
        setPhase("idle");
        setStopping(false);
        toast.info(copy.stoppedToast);
        router.refresh();
        return;
      }

      if (manager.status === "failed") {
        setPhase("error");
        setStopping(false);
        toast.error(manager.error ?? copy.failToast);
        router.refresh();
        return;
      }

      if (manager.status === "completed" && manager.results) {
        const pipeline = manager.results;
        setResults(pipeline);
        setPhase("complete");
        setStopping(false);

        const found = pipeline.search?.found ?? 0;
        const saved = pipeline.search?.saved ?? 0;
        const scored = pipeline.scoring?.scored ?? 0;
        if (found > 0 || scored > 0) {
          toast.success(
            `${copy.completePrefix} — ${found} found${saved > 0 ? `, ${saved} new` : ""}, ${scored} scored`
          );
        } else {
          toast.warning(copy.emptyWarning);
        }

        const params = new URLSearchParams(window.location.search);
        if (variant === "hunt") {
          params.delete("country");
          params.delete("huntMode");
        }
        params.set("sort", "date");
        clearPageParam(params);
        if (onCompleteTab) params.set("tab", onCompleteTab);
        router.push(`${basePath}?${params.toString()}#${resultsAnchorId}`);
        router.refresh();
      }
    },
    [basePath, copy, onCompleteTab, resultsAnchorId, router, variant]
  );

  const applyActivity = useCallback(
    (data: ActivityResponse) => {
      const agents = data.agents ?? [];
      setHunter(agents.find((a) => a.type === "job_hunter") ?? null);
      setMatcher(agents.find((a) => a.type === "job_match") ?? null);

      const pipelineRunning = data.pipeline?.running ?? false;

      if (pipelineRunning) {
        wasWatchingRef.current = true;
        setPhase("running");
        return;
      }

      if (wasWatchingRef.current) {
        wasWatchingRef.current = false;
        finishPipeline(data);
      }
    },
    [finishPipeline]
  );

  const pollActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/activity", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ActivityResponse;
      applyActivity(data);
    } catch {
      // ignore poll errors
    }
  }, [applyActivity]);

  useEffect(() => {
    void pollActivity();
    pollRef.current = setInterval(pollActivity, POLL_MS);
    return () => stopPolling();
  }, [pollActivity, stopPolling]);

  const steps = buildSteps(
    variant,
    phase,
    hunter,
    matcher,
    countryLabel,
    modeLabel,
    results,
    providerCount
  );
  const progress = overallProgress(steps, hunter, matcher);

  async function handleRun() {
    completionHandledForRef.current = null;
    setPhase("running");
    setResults(null);
    setStopping(false);
    wasWatchingRef.current = true;

    try {
      const res = await fetch("/api/agents/run", { method: "POST" });
      const data = (await res.json()) as { started?: boolean; alreadyRunning?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? copy.failRun);
      if (data.alreadyRunning) {
        toast.info(copy.alreadyRunningToast);
      }
      void pollActivity();
    } catch (err) {
      wasWatchingRef.current = false;
      setPhase("error");
      toast.error(err instanceof Error ? err.message : copy.failRun);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      const res = await fetch("/api/agents/cancel", { method: "POST" });
      if (!res.ok) throw new Error("Failed to stop");
      toast.info(copy.stoppingToast);
      void pollActivity();
    } catch (err) {
      setStopping(false);
      toast.error(err instanceof Error ? err.message : "Failed to stop");
    }
  }

  const isRunning = phase === "running";
  const statusLabel =
    phase === "running"
      ? copy.runningStatus
      : phase === "complete"
        ? "Complete"
        : phase === "error"
          ? "Failed"
          : "Ready";

  const statusVariant =
    phase === "running"
      ? "default"
      : phase === "complete"
        ? "secondary"
        : phase === "error"
          ? "destructive"
          : "outline";

  return (
    <div className="rounded-xl border border-border/80 bg-card/50 overflow-hidden shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{copy.title}</h3>
            <Badge variant={statusVariant} className="text-[10px] uppercase tracking-wide">
              {isRunning && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {statusLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {isRunning && (
            <Button
              onClick={handleStop}
              disabled={stopping}
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {stopping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Stopping…
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  {copy.stopButton}
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleRun}
            disabled={isRunning}
            variant="premium"
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.runningButton}
              </>
            ) : (
              <>
                <Radar className="h-4 w-4" />
                {phase === "complete" ? copy.againButton : copy.startButton}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isRunning ? "Processing…" : phase === "complete" ? "Last run" : "Pipeline status"}
            </span>
            <span className="tabular-nums font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <ol className="space-y-0">
          {steps.map((step, index) => {
            const StateIcon = stepIcon(step.state);
            const StepIcon = step.icon;
            return (
              <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < steps.length - 1 && (
                  <span
                    className={cn(
                      "absolute left-[15px] top-8 bottom-0 w-px",
                      step.state === "complete" ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                    step.state === "complete" && "border-primary/30 bg-primary/10 text-primary",
                    step.state === "active" && "border-primary bg-primary/15 text-primary",
                    step.state === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
                    step.state === "pending" && "border-border bg-muted/30 text-muted-foreground"
                  )}
                >
                  {step.state === "active" ? (
                    <StateIcon className="h-4 w-4 animate-spin" />
                  ) : step.state === "complete" ? (
                    <StateIcon className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.state === "active" && "text-primary",
                      step.state === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {isRunning && (hunter?.latestMessage || matcher?.latestMessage) && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-[11px] font-medium text-primary mb-0.5">Live agent log</p>
            <p className="text-xs font-mono text-foreground/80 line-clamp-2">
              {matcher?.status === "running" ? matcher.latestMessage : hunter?.latestMessage}
            </p>
          </div>
        )}

        {phase === "idle" && lastRun && lastRun.status === "completed" && (
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
            {copy.previousRun}
            {lastRun.completedAt ? ` · ${formatRelativeTime(lastRun.completedAt)}` : ""}
            {" · "}
            {lastRun.found} found
            {lastRun.saved > 0 ? `, ${lastRun.saved} new` : ""}
            {lastRun.scored > 0 ? `, ${lastRun.scored} scored` : ""}
            {lastRun.highMatches > 0 ? `, ${lastRun.highMatches} high matches` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

/** Country-focused pipeline (Local Job Hunt). */
export function HuntPipelinePanel(
  props: Omit<JobSearchPipelinePanelProps, "variant" | "basePath" | "resultsAnchorId"> & {
    countryLabel: string;
    modeLabel: string;
  }
) {
  return (
    <JobSearchPipelinePanel
      {...props}
      variant="hunt"
      basePath="/dashboard/hunt"
      resultsAnchorId="hunt-results"
    />
  );
}
