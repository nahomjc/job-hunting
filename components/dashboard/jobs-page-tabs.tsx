"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Building2, Radar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_CONFIG = [
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
    description: "Companies without websites — pitch web or marketing services.",
  },
] as const;

export type JobsPageTab = (typeof TAB_CONFIG)[number]["value"];

const VALID_TABS = new Set<string>(TAB_CONFIG.map((t) => t.value));

function parseTab(value: string | null): JobsPageTab {
  if (value && VALID_TABS.has(value)) return value as JobsPageTab;
  return "results";
}

interface JobsPageTabsProps {
  results: ReactNode;
  search: ReactNode;
  leads: ReactNode;
}

export function JobsPageTabs({ results, search, leads }: JobsPageTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<JobsPageTab>(() => parseTab(searchParams.get("tab")));

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
      router.replace(query ? `/dashboard/jobs?${query}` : "/dashboard/jobs", {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const active = TAB_CONFIG.find((t) => t.value === tab) ?? TAB_CONFIG[0];

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3 gap-1">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
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
