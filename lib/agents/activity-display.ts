import type { AgentType } from "@/lib/ai/agents/base-agent";

export const FEATURED_AGENT_TYPES = [
  "job_hunter",
  "job_match",
  "resume",
  "outreach",
] as const satisfies readonly AgentType[];

export type FeaturedAgentType = (typeof FEATURED_AGENT_TYPES)[number];

export type AgentIconKey = "search" | "target" | "file" | "mail";

export interface AgentDisplayConfig {
  type: FeaturedAgentType;
  name: string;
  description: string;
  iconKey: AgentIconKey;
  gradient: string;
  glowColor: string;
}

export const AGENT_DISPLAY: Record<FeaturedAgentType, AgentDisplayConfig> = {
  job_hunter: {
    type: "job_hunter",
    name: "Job Hunter Agent",
    description: "Scans job boards and discovers new opportunities",
    iconKey: "search",
    gradient: "from-cyan-500/20 to-blue-600/10",
    glowColor: "hsl(190 90% 50% / 0.25)",
  },
  job_match: {
    type: "job_match",
    name: "Match Analyzer Agent",
    description: "Scores jobs against your profile with AI",
    iconKey: "target",
    gradient: "from-violet-500/20 to-purple-600/10",
    glowColor: "hsl(270 80% 60% / 0.25)",
  },
  resume: {
    type: "resume",
    name: "Resume Agent",
    description: "Tailors and optimizes your resume per role",
    iconKey: "file",
    gradient: "from-emerald-500/20 to-teal-600/10",
    glowColor: "hsl(160 70% 45% / 0.25)",
  },
  outreach: {
    type: "outreach",
    name: "Outreach Agent",
    description: "Generates recruiter emails and LinkedIn messages",
    iconKey: "mail",
    gradient: "from-amber-500/20 to-orange-600/10",
    glowColor: "hsl(35 90% 55% / 0.25)",
  },
};

export function getIdleMessage(type: AgentType): string {
  switch (type) {
    case "job_hunter":
      return "Standing by — ready to scan job boards";
    case "job_match":
      return "Idle — waiting for jobs to analyze";
    case "resume":
      return "Idle — ready to tailor resumes";
    case "outreach":
      return "Idle — ready to draft outreach";
    default:
      return "Standing by";
  }
}

export function formatLogTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return formatLogTime(d);
}

export function agentDisplayName(type: string): string {
  const key = type as FeaturedAgentType;
  return AGENT_DISPLAY[key]?.name ?? type;
}
