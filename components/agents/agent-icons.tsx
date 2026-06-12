"use client";

import { Search, Target, FileText, Mail, type LucideIcon } from "lucide-react";
import type { AgentIconKey } from "@/lib/agents/activity-display";

export const AGENT_ICONS: Record<AgentIconKey, LucideIcon> = {
  search: Search,
  target: Target,
  file: FileText,
  mail: Mail,
};
