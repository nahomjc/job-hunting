"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Building2, Radar, type LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type HuntJobsPageTab = "results" | "search" | "leads";

interface TabConfigItem {
  value: HuntJobsPageTab;
  label: string;
  icon: LucideIcon;
  description: string;
}

const JOBS_TAB_CONFIG: TabConfigItem[] = [
  {
    value: "results",
    label: "Results",
    icon: Briefcase,
    description: "Scored jobs — sort, filter, and investigate employers.",
  },
  {
    value: "search",
    label: "Search & score",
    icon: Radar,
    description: "Run the job search pipeline across job boards.",
  },
  {
    value: "leads",
    label: "Business leads",
    icon: Building2,
    description: "Local companies without websites — pitch web or marketing services.",
  },
];

const HUNT_TAB_CONFIG: TabConfigItem[] = [
  {
    value: "results",
    label: "Results",
    icon: Briefcase,
    description: "Country hunt results — sort, filter, and investigate employers.",
  },
  {
    value: "search",
    label: "Country hunt",
    icon: Radar,
    description: "Run a country-targeted scan across job boards, then AI-score matches.",
  },
  {
    value: "leads",
    label: "Business leads",
    icon: Building2,
    description: "Scan maps in your hunt country for local businesses that need a website.",
  },
];

const VALID_TABS = new Set<string>(["results", "search", "leads"]);

function parseTab(value: string | null): HuntJobsPageTab {
  if (value && VALID_TABS.has(value)) return value as HuntJobsPageTab;
  return "results";
}

interface HuntJobsPageTabsProps {
  basePath: "/dashboard/jobs" | "/dashboard/hunt";
  results: ReactNode;
  search: ReactNode;
  leads: ReactNode;
}

export function HuntJobsPageTabs({ basePath, results, search, leads }: HuntJobsPageTabsProps) {
  const tabConfig = basePath === "/dashboard/hunt" ? HUNT_TAB_CONFIG : JOBS_TAB_CONFIG;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<HuntJobsPageTab>(() => parseTab(searchParams.get("tab")));

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const onTabChange = useCallback(
    (value: string) => {
      const next = parseTab(value);
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "results") params.delete("tab");
      else params.set("tab", next);
      const query = params.toString();
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
    },
    [basePath, router, searchParams]
  );

  const active = tabConfig.find((t) => t.value === tab) ?? tabConfig[0];

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3 gap-1">
          {tabConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="min-w-0 px-2 sm:px-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate text-xs sm:text-sm">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 mt-4">
          <p className="text-sm font-medium">{active.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{active.description}</p>
        </div>

        <TabsContent value="results" className="mt-4 space-y-4">
          {results}
        </TabsContent>
        <TabsContent value="search" className="mt-4 space-y-4">
          {search}
        </TabsContent>
        <TabsContent value="leads" className="mt-4 space-y-4">
          {leads}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** @deprecated Use HuntJobsPageTabs */
export const JobsPageTabs = HuntJobsPageTabs;

export type JobsPageTab = HuntJobsPageTab;
